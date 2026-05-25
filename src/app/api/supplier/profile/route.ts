import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { delCache } from "@/lib/redis";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const supplier = await prisma.supplier.findUnique({
      where: { id: session.id },
      include: {
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
    const { name, bioHe, city, serviceAreas, basePriceFrom, basePriceTo, email } =
      body as {
        name?: string;
        bioHe?: string;
        city?: string;
        serviceAreas?: string[];
        basePriceFrom?: number;
        basePriceTo?: number;
        email?: string;
      };

    const updated = await prisma.supplier.update({
      where: { id: session.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(bioHe !== undefined ? { bioHe } : {}),
        ...(city !== undefined ? { city } : {}),
        ...(serviceAreas !== undefined ? { serviceAreas } : {}),
        ...(basePriceFrom !== undefined ? { basePriceFrom } : {}),
        ...(basePriceTo !== undefined ? { basePriceTo } : {}),
        ...(email !== undefined ? { email } : {}),
      },
    });

    await delCache(`supplier:${session.slug}`);

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /api/supplier/profile]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
