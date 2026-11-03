import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { parseEvidenceFilters, buildEvidenceWhere, fetchEvidence } from "@/lib/evidence-query";
import { logAdminAction } from "@/lib/activity-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const COLUMNS = [
  "seq", "createdAt", "type", "actorType", "actorId", "customerId", "customerName", "customerPhone",
  "supplierId", "supplierName", "targetType", "targetId", "payload", "ip", "userAgent", "sessionId", "prevHash", "hash",
] as const;

function csvCell(v: unknown): string {
  const s = v == null ? "" : typeof v === "string" ? v : JSON.stringify(v);
  return `"${s.replace(/"/g, '""')}"`;
}

// CSV export of the evidence trail for the current filters (chronological).
export async function GET(request: NextRequest) {
  const { error } = requireAdminSession(request);
  if (error) return error;
  try {
    const filters = parseEvidenceFilters(request.nextUrl.searchParams);
    const where = await buildEvidenceWhere(filters);
    const lines: string[] = [COLUMNS.join(",")];
    let cursor: bigint | null = null;
    for (let i = 0; i < 100; i++) {
      const { rows, nextCursor } = await fetchEvidence(where, { take: 500, cursorSeq: cursor, order: "asc" });
      for (const r of rows) lines.push(COLUMNS.map((c) => csvCell(r[c])).join(","));
      if (!nextCursor) break;
      cursor = BigInt(nextCursor);
    }
    logAdminAction(request, { route: "/api/admin/evidence/export", body: { filters, rows: lines.length - 1 } });
    const body = "﻿" + lines.join("\r\n");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="evidence-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/evidence/export]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
