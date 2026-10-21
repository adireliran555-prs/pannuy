import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { delCache } from "@/lib/redis";
import { maybeActivateSupplierListing } from "@/lib/supplier-activation";
import { normalizeEventTypes } from "@/lib/event-types";
import { Category } from "@prisma/client";
import { z } from "zod";

const patchSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    bioHe: z.string().max(5000).optional(),
    city: z.string().max(100).optional(),
    serviceAreas: z.array(z.string().max(100)).max(50).optional(),
    supportedEventTypes: z.array(z.string().max(50)).max(20).optional(),
    basePriceFrom: z.number().int().nonnegative().nullable().optional(),
    basePriceTo: z.number().int().nonnegative().nullable().optional(),
    email: z.string().email().max(200).or(z.literal("")).optional(),
    category: z.string().optional(),
  })
  .refine(
    (v) =>
      v.basePriceFrom == null || v.basePriceTo == null || v.basePriceFrom <= v.basePriceTo,
    { path: ["basePriceTo"], message: "טווח מחירים לא תקין" }
  );

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
        supportedEventTypes: true,
        basePriceFrom: true,
        basePriceTo: true,
        ratingAvg: true,
        ratingCount: true,
        isVerified: true,
        isActive: true,
        googleCalendarId: true,
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

    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      const priceIssue = parsed.error.issues.some((i) => String(i.path[0]).startsWith("basePrice"));
      return NextResponse.json(
        { success: false, error: priceIssue ? "טווח מחירים לא תקין" : "נתונים לא תקינים" },
        { status: 400 }
      );
    }
    const { name, bioHe, city, serviceAreas, supportedEventTypes, basePriceFrom, basePriceTo, email, category } =
      parsed.data;

    const nextSupportedEventTypes =
      supportedEventTypes !== undefined
        ? normalizeEventTypes(supportedEventTypes)
        : undefined;

    if (
      supportedEventTypes !== undefined &&
      nextSupportedEventTypes!.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "חובה לבחור לפחות סוג אירוע אחד" },
        { status: 400 }
      );
    }

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
        ...(nextSupportedEventTypes !== undefined
          ? { supportedEventTypes: nextSupportedEventTypes }
          : {}),
        ...(basePriceFrom !== undefined ? { basePriceFrom } : {}),
        ...(basePriceTo !== undefined ? { basePriceTo } : {}),
        ...(email !== undefined ? { email } : {}),
      },
    });

    await delCache(`supplier:${updated.slug}`);
    revalidatePath(`/suppliers/${updated.slug}`);
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
