import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { delCache } from "@/lib/redis";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const { id } = await params;

    const photo = await prisma.supplierPhoto.findUnique({ where: { id } });

    if (!photo) {
      return NextResponse.json(
        { success: false, error: "תמונה לא נמצאה" },
        { status: 404 }
      );
    }

    if (photo.supplierId !== session.id) {
      return NextResponse.json(
        { success: false, error: "אין הרשאה" },
        { status: 403 }
      );
    }

    await prisma.supplierPhoto.delete({ where: { id } });
    await delCache(`supplier:${session.slug}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/supplier/photos/[id]]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
