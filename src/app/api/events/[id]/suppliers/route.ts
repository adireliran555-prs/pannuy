import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/api-auth";
import { searchSuppliers } from "@/lib/searchSuppliers";
import { isPlanCategory } from "@/lib/event-planning";
import type { Category } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/events/[id]/suppliers?category=VENUE
// Returns suppliers for a plan category, pre-filtered by the event's area/date/
// type, annotated with budget-fit and preferred-partner flags (partners of the
// already-chosen venue float to the top), plus each supplier's packages.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const { id: eventId } = await params;
    const categoryParam = request.nextUrl.searchParams.get("category") ?? "";
    if (!isPlanCategory(categoryParam)) {
      return NextResponse.json(
        { success: false, error: "קטגוריה לא תקינה" },
        { status: 400 }
      );
    }
    const category = categoryParam as Category;

    const event = await prisma.event.findFirst({
      where: { id: eventId, userId: session.id },
      include: {
        items: {
          select: { category: true, status: true, selectedSupplierId: true, allocatedBudget: true },
        },
      },
    });
    if (!event) {
      return NextResponse.json(
        { success: false, error: "אירוע לא נמצא" },
        { status: 404 }
      );
    }

    const item = event.items.find((i) => i.category === category);
    const allocatedBudget = item?.allocatedBudget ?? null;

    // Base list reuses the search engine (availability + area fallback + type).
    const result = await searchSuppliers({
      category,
      areas: event.areas.length ? event.areas : undefined,
      date: event.date ? event.date.toISOString().slice(0, 10) : undefined,
      eventType: event.type,
      limit: 50,
    });

    const supplierIds = result.suppliers.map((s) => s.id);

    // Packages for all listed suppliers, in one query.
    const packages = supplierIds.length
      ? await prisma.supplierPackage.findMany({
          where: { supplierId: { in: supplierIds } },
          orderBy: [{ isPopular: "desc" }, { price: "asc" }],
          select: {
            id: true,
            supplierId: true,
            nameHe: true,
            descHe: true,
            price: true,
            hours: true,
            includes: true,
            isPopular: true,
          },
        })
      : [];
    const packagesBySupplier = new Map<string, typeof packages>();
    for (const pkg of packages) {
      const list = packagesBySupplier.get(pkg.supplierId) ?? [];
      list.push(pkg);
      packagesBySupplier.set(pkg.supplierId, list);
    }

    // Preferred partners of the chosen venue for this category (soft ranking).
    const venueItem = event.items.find(
      (i) => i.category === ("VENUE" as Category) && i.status === "SELECTED"
    );
    let preferredIds = new Set<string>();
    let venueName: string | null = null;
    if (venueItem?.selectedSupplierId && category !== ("VENUE" as Category)) {
      const [rels, venue] = await Promise.all([
        prisma.supplierRelationship.findMany({
          where: { fromSupplierId: venueItem.selectedSupplierId, category },
          select: { toSupplierId: true },
        }),
        prisma.supplier.findUnique({
          where: { id: venueItem.selectedSupplierId },
          select: { name: true },
        }),
      ]);
      preferredIds = new Set(rels.map((r) => r.toSupplierId));
      venueName = venue?.name ?? null;
    }

    const suppliers = result.suppliers.map((s) => {
      const cover = s.photos.find((p) => p.type === "COVER");
      const profile = s.photos.find((p) => p.type === "PROFILE");
      const withinBudget =
        allocatedBudget === null ||
        s.basePriceFrom === null ||
        s.basePriceFrom <= allocatedBudget;
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        category: s.category,
        city: s.city,
        priceFrom: s.basePriceFrom,
        priceTo: s.basePriceTo,
        rating: s.ratingAvg,
        ratingCount: s.ratingCount,
        isVerified: s.isVerified,
        profilePhoto: profile?.cloudinaryUrl ?? s.photos[0]?.cloudinaryUrl ?? null,
        coverPhoto: cover?.cloudinaryUrl ?? null,
        isPreferred: preferredIds.has(s.id),
        withinBudget,
        packages: (packagesBySupplier.get(s.id) ?? []).map((p) => ({
          id: p.id,
          nameHe: p.nameHe,
          descHe: p.descHe,
          price: p.price,
          hours: p.hours,
          includes: p.includes,
          isPopular: p.isPopular,
        })),
      };
    });

    // Preferred partners first, then within-budget, preserving relevance order.
    suppliers.sort((a, b) => {
      if (a.isPreferred !== b.isPreferred) return a.isPreferred ? -1 : 1;
      if (a.withinBudget !== b.withinBudget) return a.withinBudget ? -1 : 1;
      return 0;
    });

    return NextResponse.json({
      success: true,
      data: {
        category,
        allocatedBudget,
        areaFallback: result.areaFallback,
        venueName,
        suppliers,
      },
    });
  } catch (err) {
    console.error("[GET /api/events/[id]/suppliers]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
