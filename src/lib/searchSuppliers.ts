import prisma from "@/lib/prisma";
import { Category } from "@prisma/client";

export interface SearchFilters {
  areas?: string[];
  date?: string;
  category?: Category;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
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

export async function searchSuppliers(filters: SearchFilters): Promise<SearchResult> {
  const limit = filters.limit ?? DEFAULT_LIMIT;
  const page = filters.page ?? 1;
  const skip = (page - 1) * limit;

  let blockedSupplierIds: string[] | undefined;
  if (filters.date) {
    const blockedSlots = await prisma.availabilitySlot.groupBy({
      by: ["supplierId"],
      where: { date: new Date(filters.date), isBlocked: true },
      _count: { supplierId: true },
      having: { supplierId: { _count: { gte: 10 } } },
    });
    blockedSupplierIds = blockedSlots.map((s) => s.supplierId);
  }

  const where = {
    isActive: true,
    isVerified: true,
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.areas && filters.areas.length > 0
      ? { serviceAreas: { hasSome: filters.areas } }
      : {}),
    ...(filters.priceMin !== undefined ? { basePriceFrom: { gte: filters.priceMin } } : {}),
    ...(filters.priceMax !== undefined ? { basePriceTo: { lte: filters.priceMax } } : {}),
    ...(filters.ratingMin !== undefined ? { ratingAvg: { gte: filters.ratingMin } } : {}),
    ...(blockedSupplierIds && blockedSupplierIds.length > 0
      ? { id: { notIn: blockedSupplierIds } }
      : {}),
  };

  const orderBy = [
    { ratingAvg: "desc" as const },
    { ratingCount: "desc" as const },
  ];

  let [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({ where, skip, take: limit, orderBy, select: SUPPLIER_SELECT }),
    prisma.supplier.count({ where }),
  ]);

  let areaFallback = false;
  if (total === 0 && filters.areas && filters.areas.length > 0) {
    const whereNoArea = { ...where };
    delete (whereNoArea as Record<string, unknown>).serviceAreas;
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
