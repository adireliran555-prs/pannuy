import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getCache, setCache } from "@/lib/redis";
import { Category } from "@prisma/client";
import { searchSuppliers, type SearchFilters } from "@/lib/searchSuppliers";

const CACHE_TTL = 60; // 1 minute

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const areasParam = searchParams.get("areas") ?? undefined;
    const areas = areasParam ? areasParam.split(",").filter(Boolean) : undefined;
    const date = searchParams.get("date") ?? undefined;
    const categoryParam = searchParams.get("category") ?? undefined;
    const priceMin = searchParams.get("priceMin")
      ? parseInt(searchParams.get("priceMin")!, 10)
      : undefined;
    const priceMax = searchParams.get("priceMax")
      ? parseInt(searchParams.get("priceMax")!, 10)
      : undefined;
    const sortParam = searchParams.get("sortBy");
    const eventType = searchParams.get("eventType") ?? undefined;
    const sortBy: SearchFilters["sortBy"] =
      sortParam === "priceAsc" || sortParam === "priceDesc" || sortParam === "relevance"
        ? sortParam
        : undefined;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : undefined;

    const category =
      categoryParam && Object.values(Category).includes(categoryParam as Category)
        ? (categoryParam as Category)
        : undefined;

    const filters = { areas, date, category, eventType, priceMin, priceMax, sortBy, page, limit };
    const cacheKey = `search:${createHash("md5").update(JSON.stringify(filters)).digest("hex")}`;

    const cached = await getCache(cacheKey);
    if (cached) return NextResponse.json(cached);

    const data = await searchSuppliers(filters);
    const result = { success: true, data };
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
