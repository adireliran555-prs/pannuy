import { NextRequest, NextResponse } from "next/server";
import { requireAgentSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireAgentSession(request);
    if (error) return error;

    return NextResponse.json({ success: true, agent: session });
  } catch (err) {
    console.error("[GET /api/agent/auth/me]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
