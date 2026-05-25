import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSupplierSession } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const session = getSupplierSession(request);

    if (session) {
      // Clear session token in DB
      await prisma.supplier.update({
        where: { id: session.id },
        data: { sessionToken: null },
      }).catch(() => {
        // Supplier might not exist — swallow
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete("pannuy_supplier_session");
    return response;
  } catch (err) {
    console.error("[POST /api/supplier/auth/logout]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
