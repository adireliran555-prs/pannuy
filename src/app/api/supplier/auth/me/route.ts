import { NextRequest, NextResponse } from "next/server";
import { requireSupplierSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    return NextResponse.json({ success: true, supplier: session });
  } catch (err) {
    console.error("[GET /api/supplier/auth/me]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
