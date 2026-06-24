import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { delCache } from "@/lib/redis";
import { maybeActivateSupplierListing } from "@/lib/supplier-activation";
import { Category } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const supplier = await prisma.supplier.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        slug: true,
        name: true,
        phone: true,
        email: true,
        category: true,
        bioHe: true,
        city: true,
        serviceAreas: true,
        basePriceFrom: true,
        basePriceTo: true,
        ratingAvg: true,
        ratingCount: true,
        isVerified: true,
        isActive: true,
        googleCalendarId: true,
        responseRate: true,
        createdAt: true,
        updatedAt: true,
        affiliateCode: true,
        warningCount: true,
        subscriptionStatus: true,
        subscriptionStartAt: true,
        highlights: true,
        photos: { orderBy: { sortOrder: "asc" } },
        packages: { orderBy: { price: "asc" } },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "ספק לא נמצא" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: supplier });
  } catch (err) {
    console.error("[GET /api/supplier/profile]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const body = await request.json();
    const { name, bioHe, city, serviceAreas, basePriceFrom, basePriceTo, email, category } =
      body as {
        name?: string;
        bioHe?: string;
        city?: string;
        serviceAreas?: string[];
        basePriceFrom?: number;
        basePriceTo?: number;
        email?: string;
        category?: string;
      };

    const nextCategory =
      category && Object.values(Category).includes(category as Category)
        ? (category as Category)
        : undefined;

    const updated = await prisma.supplier.update({
      where: { id: session.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(nextCategory !== undefined ? { category: nextCategory } : {}),
        ...(bioHe !== undefined ? { bioHe } : {}),
        ...(city !== undefined ? { city } : {}),
        ...(serviceAreas !== undefined ? { serviceAreas } : {}),
        ...(basePriceFrom !== undefined ? { basePriceFrom } : {}),
        ...(basePriceTo !== undefined ? { basePriceTo } : {}),
        ...(email !== undefined ? { email } : {}),
      },
    });

    await delCache(`supplier:${updated.slug}`);
    await maybeActivateSupplierListing(session.id);

    const fresh = await prisma.supplier.findUnique({
      where: { id: session.id },
      select: { isActive: true },
    });

    return NextResponse.json({
      success: true,
      data: { ...updated, isActive: fresh?.isActive ?? updated.isActive },
    });
  } catch (err) {
    console.error("[PATCH /api/supplier/profile]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
