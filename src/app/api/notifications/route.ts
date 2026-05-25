import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerSession, getSupplierSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const customerSession = getCustomerSession(request);
    const supplierSession = getSupplierSession(request);

    if (!customerSession && !supplierSession) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const where = customerSession
      ? { userId: customerSession.id }
      : { supplierId: supplierSession!.id };

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);

    return NextResponse.json({
      success: true,
      data: { notifications, unreadCount },
    });
  } catch (err) {
    console.error("[GET /api/notifications]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
