import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { MeetingStatus } from "@prisma/client";
import { logEventAsync, requestMeta, ActivityType } from "@/lib/activity";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const { searchParams } = request.nextUrl;
    const statusParam = searchParams.get("status");
    const validStatuses = Object.values(MeetingStatus);
    const statusFilter =
      statusParam && validStatuses.includes(statusParam as MeetingStatus)
        ? { status: statusParam as MeetingStatus }
        : {};

    const meetings = await prisma.meeting.findMany({
      where: {
        supplierId: session.id,
        ...statusFilter,
      },
      orderBy: { requestedDate: "asc" },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, weddingDate: true, weddingArea: true },
        },
        review: { select: { id: true, rating: true } },
      },
    });

    // Strip customer phone from PENDING meetings — only reveal after confirmation
    const sanitized = meetings.map((m) => {
      if (m.status !== "PENDING") return m;
      const { phone: _phone, ...customerWithoutPhone } = m.customer;
      return { ...m, customer: customerWithoutPhone };
    });

    // Each non-pending meeting reveals the customer phone to the supplier —
    // record the exposure (once per meeting per 24h).
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const revealed = meetings.filter((m) => m.status !== "PENDING" && m.customer?.phone);
    if (revealed.length > 0) {
      const recent = await prisma.activityEvent.findMany({
        where: {
          type: ActivityType.CUSTOMER_CONTACT_EXPOSED,
          supplierId: session.id,
          targetType: "meeting",
          targetId: { in: revealed.map((m) => m.id) },
          createdAt: { gte: since },
        },
        select: { targetId: true },
      });
      const seen = new Set(recent.map((r) => r.targetId));
      const meta = requestMeta(request);
      for (const m of revealed) {
        if (seen.has(m.id)) continue;
        logEventAsync({
          type: ActivityType.CUSTOMER_CONTACT_EXPOSED,
          actorType: "supplier",
          actorId: session.id,
          customerId: m.customerId,
          supplierId: session.id,
          targetType: "meeting",
          targetId: m.id,
          payload: { customerPhone: m.customer.phone, customerName: m.customer.name, meetingId: m.id, status: m.status },
          meta,
        });
      }
    }

    return NextResponse.json({ success: true, data: sanitized });
  } catch (err) {
    console.error("[GET /api/supplier/meetings]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
