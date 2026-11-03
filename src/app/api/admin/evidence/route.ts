import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { parseEvidenceFilters, buildEvidenceWhere, fetchEvidence } from "@/lib/evidence-query";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { error } = requireAdminSession(request);
  if (error) return error;
  try {
    const sp = request.nextUrl.searchParams;
    const filters = parseEvidenceFilters(sp);
    const take = Math.min(Math.max(parseInt(sp.get("take") ?? "100", 10) || 100, 1), 500);
    const cursorRaw = sp.get("cursor");
    const cursorSeq = cursorRaw && /^\d+$/.test(cursorRaw) ? BigInt(cursorRaw) : null;
    const where = await buildEvidenceWhere(filters);
    const { rows, nextCursor } = await fetchEvidence(where, { take, cursorSeq });
    return NextResponse.json({ success: true, data: { rows, nextCursor } });
  } catch (err) {
    console.error("[GET /api/admin/evidence]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
