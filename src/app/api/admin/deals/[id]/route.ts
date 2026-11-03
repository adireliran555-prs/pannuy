import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/api-auth";
import { logEventAsync, requestMeta, ActivityType } from "@/lib/activity";
import { DealReportStatus } from "@prisma/client";
import { z } from "zod";

const schema = z.object({ status: z.nativeEnum(DealReportStatus) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = requireAdminSession(request);
  if (error) return error;
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "סטטוס לא תקין" }, { status: 400 });
  }
  try {
    const before = await prisma.dealReport.findUnique({
      where: { id },
      select: { status: true, supplierId: true, customerId: true },
    });
    if (!before) {
      return NextResponse.json({ success: false, error: "דיווח לא נמצא" }, { status: 404 });
    }
    const updated = await prisma.dealReport.update({ where: { id }, data: { status: parsed.data.status } });

    logEventAsync({
      type: ActivityType.DEAL_REPORT_STATUS_CHANGED,
      actorType: "admin",
      actorId: session.phone,
      customerId: before.customerId,
      supplierId: before.supplierId,
      targetType: "DealReport",
      targetId: id,
      payload: { from: before.status, to: parsed.data.status },
      meta: requestMeta(request),
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /api/admin/deals/[id]]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
