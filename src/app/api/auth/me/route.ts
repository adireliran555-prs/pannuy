import { NextRequest, NextResponse } from "next/server";
import { requireCustomerSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    return NextResponse.json({ success: true, user: session });
  } catch (err) {
    console.error("[GET /api/auth/me]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
