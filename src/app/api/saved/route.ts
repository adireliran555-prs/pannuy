import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const saved = await prisma.savedSupplier.findMany({
      where: { customerId: session.id },
      orderBy: { createdAt: "desc" },
      include: {
        supplier: {
          select: {
            id: true,
            slug: true,
            name: true,
            category: true,
            city: true,
            basePriceFrom: true,
            basePriceTo: true,
            ratingAvg: true,
            ratingCount: true,
            isVerified: true,
            photos: {
              where: { type: { in: ["PROFILE", "COVER"] } },
              orderBy: { sortOrder: "asc" },
              take: 2,
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (err) {
    console.error("[GET /api/saved]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const body = await request.json();
    const { supplierId } = body as { supplierId?: string };

    if (!supplierId) {
      return NextResponse.json(
        { success: false, error: "supplierId חובה" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true },
    });

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "ספק לא נמצא" },
        { status: 404 }
      );
    }

    const saved = await prisma.savedSupplier.upsert({
      where: {
        customerId_supplierId: {
          customerId: session.id,
          supplierId,
        },
      },
      create: { customerId: session.id, supplierId },
      update: {},
    });

    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/saved]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
