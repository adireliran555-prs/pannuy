// Server-side service for the guided event-planning journey. Centralizes event
// creation, plan-item generation, budget (re)allocation, and the serialized
// payload (event + ordered items + budget/progress summary) used by the API.

import prisma from "@/lib/prisma";
import type { BudgetMode, Category, PlanItemStatus, Prisma } from "@prisma/client";
import {
  PLAN_PYRAMID,
  allocateBudget,
  computeSummary,
  computeTotalBudget,
  getPyramidStep,
  type PlanSummary,
} from "@/lib/event-planning";

export interface CreateEventInput {
  type: string;
  date: string | null;
  dateFlexible: boolean;
  areas: string[];
  city: string | null;
  guestCount: number | null;
  budgetMode: BudgetMode;
  budgetAmount: number | null;
  vibeTags: string[];
  kosher: boolean;
}

export interface PlanItemPayload {
  id: string;
  category: Category;
  status: PlanItemStatus;
  sortOrder: number;
  allocatedBudget: number | null;
  committedPrice: number | null;
  notes: string | null;
  selectedSupplier: {
    id: string;
    slug: string;
    name: string;
    city: string | null;
    category: Category;
    photoUrl: string | null;
  } | null;
  selectedPackage: {
    id: string;
    nameHe: string;
    price: number;
    hours: number | null;
  } | null;
}

export interface EventPayload {
  event: {
    id: string;
    type: string;
    date: string | null;
    dateFlexible: boolean;
    areas: string[];
    city: string | null;
    guestCount: number | null;
    budgetMode: BudgetMode;
    budgetAmount: number | null;
    vibeTags: string[];
    kosher: boolean;
    status: string;
    createdAt: string;
  };
  items: PlanItemPayload[];
  summary: PlanSummary;
}

const SUPPLIER_MINI_SELECT = {
  id: true,
  slug: true,
  name: true,
  city: true,
  category: true,
  photos: {
    where: { type: { in: ["PROFILE", "COVER"] } },
    orderBy: { sortOrder: "asc" },
    take: 1,
  },
} satisfies Prisma.SupplierSelect;

function toDateOnly(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Creates an event plus one plan item per pyramid category (idempotent per user is NOT enforced — callers decide). */
export async function createEventWithItems(userId: string, input: CreateEventInput) {
  const total = computeTotalBudget({
    budgetMode: input.budgetMode,
    budgetAmount: input.budgetAmount,
    guestCount: input.guestCount,
  });
  const allocation = allocateBudget(total);

  const event = await prisma.event.create({
    data: {
      userId,
      type: input.type,
      date: toDateOnly(input.date),
      dateFlexible: input.dateFlexible,
      areas: input.areas,
      city: input.city,
      guestCount: input.guestCount,
      budgetMode: input.budgetMode,
      budgetAmount: input.budgetAmount,
      vibeTags: input.vibeTags,
      kosher: input.kosher,
      items: {
        create: PLAN_PYRAMID.map((step) => ({
          category: step.category,
          sortOrder: step.order,
          allocatedBudget: allocation[step.category] ?? null,
          status: "PENDING" as PlanItemStatus,
        })),
      },
    },
    select: { id: true },
  });

  return event.id;
}

/** Re-derives every item's recommended allocation after event budget changes. */
export async function reallocateBudget(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { budgetMode: true, budgetAmount: true, guestCount: true },
  });
  if (!event) return;

  const total = computeTotalBudget(event);
  const allocation = allocateBudget(total);

  await prisma.$transaction(
    PLAN_PYRAMID.map((step) =>
      prisma.eventPlanItem.updateMany({
        where: { eventId, category: step.category },
        data: { allocatedBudget: allocation[step.category] ?? null },
      })
    )
  );
}

/** Fetches an event owned by userId and returns the full serialized payload, or null. */
export async function getEventPayload(
  eventId: string,
  userId: string
): Promise<EventPayload | null> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, userId },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: { selectedSupplier: { select: SUPPLIER_MINI_SELECT } },
      },
    },
  });
  if (!event) return null;

  return serializeEvent(event);
}

/** The user's most recent ACTIVE event payload, or null if they have none. */
export async function getActiveEventPayload(userId: string): Promise<EventPayload | null> {
  const event = await prisma.event.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: { selectedSupplier: { select: SUPPLIER_MINI_SELECT } },
      },
    },
  });
  if (!event) return null;

  return serializeEvent(event);
}

type EventWithItems = NonNullable<Awaited<ReturnType<typeof getEventWithItemsRaw>>>;

async function getEventWithItemsRaw(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: { selectedSupplier: { select: SUPPLIER_MINI_SELECT } },
      },
    },
  });
}

async function serializeEvent(event: EventWithItems): Promise<EventPayload> {
  // Look up chosen package details for SELECTED items in a single query.
  const packageIds = event.items
    .map((i) => i.selectedPackageId)
    .filter((id): id is string => Boolean(id));

  const packages = packageIds.length
    ? await prisma.supplierPackage.findMany({
        where: { id: { in: packageIds } },
        select: { id: true, nameHe: true, price: true, hours: true },
      })
    : [];
  const packageMap = new Map(packages.map((p) => [p.id, p]));

  const total = computeTotalBudget(event);

  const items: PlanItemPayload[] = event.items.map((item) => {
    const supplier = item.selectedSupplier;
    const pkg = item.selectedPackageId ? packageMap.get(item.selectedPackageId) : undefined;
    return {
      id: item.id,
      category: item.category,
      status: item.status,
      sortOrder: item.sortOrder,
      allocatedBudget: item.allocatedBudget,
      committedPrice: item.committedPrice,
      notes: item.notes,
      selectedSupplier: supplier
        ? {
            id: supplier.id,
            slug: supplier.slug,
            name: supplier.name,
            city: supplier.city,
            category: supplier.category,
            photoUrl: supplier.photos[0]?.cloudinaryUrl ?? null,
          }
        : null,
      selectedPackage: pkg
        ? { id: pkg.id, nameHe: pkg.nameHe, price: pkg.price, hours: pkg.hours }
        : null,
    };
  });

  return {
    event: {
      id: event.id,
      type: event.type,
      date: event.date ? event.date.toISOString().slice(0, 10) : null,
      dateFlexible: event.dateFlexible,
      areas: event.areas,
      city: event.city,
      guestCount: event.guestCount,
      budgetMode: event.budgetMode,
      budgetAmount: event.budgetAmount,
      vibeTags: event.vibeTags,
      kosher: event.kosher,
      status: event.status,
      createdAt: event.createdAt.toISOString(),
    },
    items,
    summary: computeSummary(total, items),
  };
}

// Re-export so route handlers can reference the pyramid step for validation copy.
export { getPyramidStep };
