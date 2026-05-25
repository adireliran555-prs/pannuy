import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerSession, getSupplierSession } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const customerSession = getCustomerSession(request);
    const supplierSession = getSupplierSession(request);

    if (!customerSession && !supplierSession) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: "התראה לא נמצאה" },
        { status: 404 }
      );
    }

    // Ownership check
    if (customerSession && notification.userId !== customerSession.id) {
      return NextResponse.json({ success: false, error: "אין הרשאה" }, { status: 403 });
    }
    if (supplierSession && notification.supplierId !== supplierSession.id) {
      return NextResponse.json({ success: false, error: "אין הרשאה" }, { status: 403 });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/notifications/[id]/read]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
