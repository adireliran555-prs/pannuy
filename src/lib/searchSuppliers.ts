import prisma from "@/lib/prisma";
import { Category } from "@prisma/client";
import { isValidEventTypeId } from "@/lib/event-types";

export interface SearchFilters {
  areas?: string[];
  date?: string;
  category?: Category;
  eventType?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: "relevance" | "priceAsc" | "priceDesc";
  page?: number;
  limit?: number;
}

// Israeli standard working hours: 09:00–18:00 (10 one-hour slots).
// A day counts as unavailable when every working slot is blocked, or an
// all-day block exists for that date. Kept in sync with src/lib/availability.ts.
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 19;

function workingSlotTimes(): string[] {
  const slots: string[] = [];
  for (let h = WORK_START_HOUR; h < WORK_END_HOUR; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }
  return slots;
}

const ALL_WORKING_SLOTS = workingSlotTimes();

export interface SearchResult {
  suppliers: Array<{
    id: string;
    slug: string;
    name: string;
    category: Category;
    city: string | null;
    serviceAreas: string[];
    basePriceFrom: number | null;
    basePriceTo: number | null;
    ratingAvg: number;
    ratingCount: number;
    isVerified: boolean;
    photos: Array<{ cloudinaryUrl: string; type: string; sortOrder: number }>;
  }>;
  areaFallback: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const DEFAULT_LIMIT = 12;

const PHOTO_SELECT = {
  where: { type: { in: ["PROFILE", "COVER"] as ("PROFILE" | "COVER")[] } },
  orderBy: { sortOrder: "asc" as const },
};

const SUPPLIER_SELECT = {
  id: true,
  slug: true,
  name: true,
  category: true,
  city: true,
  serviceAreas: true,
  basePriceFrom: true,
  basePriceTo: true,
  ratingAvg: true,
  ratingCount: true,
  isVerified: true,
  photos: PHOTO_SELECT,
};

const MAX_LIMIT = 50;

export async function searchSuppliers(filters: SearchFilters): Promise<SearchResult> {
  const limit = Math.min(Math.max(filters.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const page = Math.max(filters.page ?? 1, 1);
  const skip = (page - 1) * limit;

  let blockedSupplierIds: string[] | undefined;
  if (filters.date) {
    // Pull every blocked slot for the requested date and decide per supplier
    // whether they have any free working slot left. A supplier is excluded only
    // when there are zero free working slots — i.e. all working-hour slots are
    // blocked, or an all-day block covers the whole working window.
    const blockedSlots = await prisma.availabilitySlot.findMany({
      where: { date: new Date(filters.date), isBlocked: true },
      select: { supplierId: true, startTime: true, endTime: true },
    });

    const blockedTimesBySupplier = new Map<string, Set<string>>();
    const allDayBlocked = new Set<string>();
    for (const slot of blockedSlots) {
      // Treat a slot spanning the entire working window as an all-day block.
      const start = parseInt(slot.startTime.slice(0, 2), 10);
      const end = parseInt(slot.endTime.slice(0, 2), 10);
      if (start <= WORK_START_HOUR && end >= WORK_END_HOUR) {
        allDayBlocked.add(slot.supplierId);
      }
      let set = blockedTimesBySupplier.get(slot.supplierId);
      if (!set) {
        set = new Set();
        blockedTimesBySupplier.set(slot.supplierId, set);
      }
      set.add(slot.startTime);
    }

    blockedSupplierIds = [...blockedTimesBySupplier.entries()]
      .filter(([supplierId, blockedTimes]) =>
        allDayBlocked.has(supplierId) ||
        ALL_WORKING_SLOTS.every((t) => blockedTimes.has(t))
      )
      .map(([supplierId]) => supplierId);
  }

  const where = {
    isActive: true,
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.eventType && isValidEventTypeId(filters.eventType)
      ? { supportedEventTypes: { has: filters.eventType } }
      : {}),
    ...(filters.areas && filters.areas.length > 0
      ? {
          OR: [
            { serviceAreas: { hasSome: filters.areas } },
            { serviceAreas: { has: "כל הארץ" } },
          ],
        }
      : {}),
    ...(filters.priceMin !== undefined ? { basePriceFrom: { gte: filters.priceMin } } : {}),
    ...(filters.priceMax !== undefined ? { basePriceTo: { lte: filters.priceMax } } : {}),
    ...(blockedSupplierIds && blockedSupplierIds.length > 0
      ? { id: { notIn: blockedSupplierIds } }
      : {}),
  };

  // Relevance favours verified, curated suppliers; price sorts are explicit.
  const orderBy =
    filters.sortBy === "priceAsc"
      ? [{ basePriceFrom: "asc" as const }]
      : filters.sortBy === "priceDesc"
        ? [{ basePriceFrom: "desc" as const }]
        : [
            { isVerified: "desc" as const },
            { ratingCount: "desc" as const },
          ];

  let [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({ where, skip, take: limit, orderBy, select: SUPPLIER_SELECT }),
    prisma.supplier.count({ where }),
  ]);

  let areaFallback = false;
  if (total === 0 && filters.areas && filters.areas.length > 0) {
    // The area constraint is applied via the `OR` clause above, so removing
    // `serviceAreas` alone would leave the filter intact. Drop `OR` instead.
    const whereNoArea = { ...where };
    delete (whereNoArea as Record<string, unknown>).OR;
    [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({ where: whereNoArea, skip, take: limit, orderBy, select: SUPPLIER_SELECT }),
      prisma.supplier.count({ where: whereNoArea }),
    ]);
    areaFallback = true;
  }

  return {
    suppliers,
    areaFallback,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
