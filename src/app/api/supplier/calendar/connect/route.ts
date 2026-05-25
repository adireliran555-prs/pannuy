import { NextRequest, NextResponse } from "next/server";
import { requireSupplierSession } from "@/lib/api-auth";
import { getAuthUrl } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const authUrl = getAuthUrl(session.id);
    return NextResponse.json({ success: true, data: { authUrl } });
  } catch (err) {
    console.error("[GET /api/supplier/calendar/connect]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
