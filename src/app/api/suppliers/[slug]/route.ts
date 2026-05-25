import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCache, setCache } from "@/lib/redis";

const CACHE_TTL = 10 * 60; // 10 minutes

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const cacheKey = `supplier:${slug}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const supplier = await prisma.supplier.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        bioHe: true,
        city: true,
        serviceAreas: true,
        basePriceFrom: true,
        basePriceTo: true,
        ratingAvg: true,
        ratingCount: true,
        isVerified: true,
        responseRate: true,
        createdAt: true,
        photos: {
          orderBy: { sortOrder: "asc" },
        },
        packages: {
          orderBy: { price: "asc" },
        },
        reviews: {
          where: { isVisible: true },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            customer: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "ספק לא נמצא" },
        { status: 404 }
      );
    }

    const result = { success: true, data: supplier };
    await setCache(cacheKey, result, CACHE_TTL);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/suppliers/[slug]]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
