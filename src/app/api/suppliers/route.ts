import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import prisma from "@/lib/prisma";
import { getCache, setCache } from "@/lib/redis";
import { Category } from "@prisma/client";

const CACHE_TTL = 60; // 1 minute
const DEFAULT_LIMIT = 12;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const area = searchParams.get("area") ?? undefined;
    const date = searchParams.get("date") ?? undefined;
    const categoryParam = searchParams.get("category") ?? undefined;
    const priceMin = searchParams.get("priceMin")
      ? parseInt(searchParams.get("priceMin")!, 10)
      : undefined;
    const priceMax = searchParams.get("priceMax")
      ? parseInt(searchParams.get("priceMax")!, 10)
      : undefined;
    const ratingMin = searchParams.get("ratingMin")
      ? parseFloat(searchParams.get("ratingMin")!)
      : undefined;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(
      searchParams.get("limit") ?? String(DEFAULT_LIMIT),
      10
    );

    // Validate category
    const category =
      categoryParam && Object.values(Category).includes(categoryParam as Category)
        ? (categoryParam as Category)
        : undefined;

    // Cache key based on all params
    const paramsHash = createHash("md5")
      .update(JSON.stringify({ area, date, category, priceMin, priceMax, ratingMin, page, limit }))
      .digest("hex");
    const cacheKey = `search:${paramsHash}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // If date filter: get supplier IDs that are fully blocked on that date
    let blockedSupplierIds: string[] | undefined;
    if (date) {
      const dateObj = new Date(date);
      const blockedSlots = await prisma.availabilitySlot.groupBy({
        by: ["supplierId"],
        where: {
          date: dateObj,
          isBlocked: true,
        },
        _count: { supplierId: true },
        having: {
          supplierId: { _count: { gte: 10 } }, // all 10 working slots blocked = fully booked
        },
      });
      blockedSupplierIds = blockedSlots.map((s) => s.supplierId);
    }

    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      isVerified: true,
      ...(category ? { category } : {}),
      ...(area ? { serviceAreas: { has: area } } : {}),
      ...(priceMin !== undefined ? { basePriceFrom: { gte: priceMin } } : {}),
      ...(priceMax !== undefined ? { basePriceTo: { lte: priceMax } } : {}),
      ...(ratingMin !== undefined ? { ratingAvg: { gte: ratingMin } } : {}),
      ...(blockedSupplierIds
        ? { id: { notIn: blockedSupplierIds } }
        : {}),
    };

    const select = {
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
      photos: {
        where: { type: { in: ["PROFILE", "COVER"] as ("PROFILE" | "COVER")[] } },
        orderBy: { sortOrder: "asc" as const },
      },
    };

    const orderBy = [{ ratingAvg: "desc" as const }, { ratingCount: "desc" as const }];

    let [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({ where, skip, take: limit, orderBy, select }),
      prisma.supplier.count({ where }),
    ]);

    // Always show suppliers: if area filter yields nothing, fall back to all
    let areaFallback = false;
    if (total === 0 && area) {
      const whereNoArea = { ...where };
      delete (whereNoArea as Record<string, unknown>).serviceAreas;
      [suppliers, total] = await Promise.all([
        prisma.supplier.findMany({ where: whereNoArea, skip, take: limit, orderBy, select }),
        prisma.supplier.count({ where: whereNoArea }),
      ]);
      areaFallback = true;
    }

    const result = {
      success: true,
      data: {
        suppliers,
        areaFallback,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };

    await setCache(cacheKey, result, CACHE_TTL);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/suppliers]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
