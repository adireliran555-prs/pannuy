import prisma from "@/lib/prisma";
import { Category } from "@prisma/client";
import { isValidEventTypeId } from "@/lib/event-types";
import { isDayFullyBlocked } from "@/lib/availability";

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

    const blocksBySupplier = new Map<string, { startTime: string; endTime: string }[]>();
    for (const slot of blockedSlots) {
      let list = blocksBySupplier.get(slot.supplierId);
      if (!list) {
        list = [];
        blocksBySupplier.set(slot.supplierId, list);
      }
      list.push({ startTime: slot.startTime, endTime: slot.endTime });
    }

    // Same rule as src/lib/availability.ts so search and the calendar agree.
    blockedSupplierIds = [...blocksBySupplier.entries()]
      .filter(([, blocks]) => isDayFullyBlocked(blocks))
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
