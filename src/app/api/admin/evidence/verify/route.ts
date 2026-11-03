import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { verifyChain } from "@/lib/activity";
import { logAdminAction } from "@/lib/activity-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Walks the whole hash chain and reports the first broken link, if any.
export async function GET(request: NextRequest) {
  const { error } = requireAdminSession(request);
  if (error) return error;
  try {
    const result = await verifyChain();
    logAdminAction(request, { route: "/api/admin/evidence/verify", body: result });
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("[GET /api/admin/evidence/verify]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
