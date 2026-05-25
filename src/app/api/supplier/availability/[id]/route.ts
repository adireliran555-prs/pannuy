import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { invalidateAvailabilityCache } from "@/lib/availability";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const { id } = await params;

    const slot = await prisma.availabilitySlot.findUnique({ where: { id } });

    if (!slot) {
      return NextResponse.json(
        { success: false, error: "חסימה לא נמצאה" },
        { status: 404 }
      );
    }

    if (slot.supplierId !== session.id) {
      return NextResponse.json(
        { success: false, error: "אין הרשאה" },
        { status: 403 }
      );
    }

    await prisma.availabilitySlot.delete({ where: { id } });
    await invalidateAvailabilityCache(session.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/supplier/availability/[id]]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
