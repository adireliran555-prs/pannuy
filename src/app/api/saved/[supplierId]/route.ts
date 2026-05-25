import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/api-auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const { supplierId } = await params;

    const existing = await prisma.savedSupplier.findUnique({
      where: {
        customerId_supplierId: {
          customerId: session.id,
          supplierId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "לא נמצא בשמורים" },
        { status: 404 }
      );
    }

    await prisma.savedSupplier.delete({
      where: {
        customerId_supplierId: {
          customerId: session.id,
          supplierId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/saved/[supplierId]]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
