import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/api-auth";
import { logEventAsync, requestMeta, ActivityType } from "@/lib/activity";
import { CustomerOutcome, ReferralStatus } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  outcome: z.nativeEnum(CustomerOutcome),
  amountIls: z.number().int().min(0).max(10_000_000).optional(),
});

// The customer tells us what happened with a supplier we introduced. This is the
// independent witness for the circumvention clause, so it is also written to the
// append-only evidence trail.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const { id } = await params;
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "נתונים לא תקינים" }, { status: 400 });
    }
    const { outcome, amountIls } = parsed.data;

    const referral = await prisma.referral.findUnique({
      where: { id },
      select: { id: true, customerId: true, supplierId: true, status: true },
    });
    if (!referral || referral.customerId !== session.id) {
      return NextResponse.json({ success: false, error: "ההפניה לא נמצאה" }, { status: 404 });
    }

    const now = new Date();
    let status: ReferralStatus = referral.status;
    const data: Record<string, unknown> = {
      customerOutcome: outcome,
      customerReportedIls: outcome === CustomerOutcome.CLOSED ? (amountIls ?? null) : null,
      customerConfirmedAt: now,
    };
    switch (outcome) {
      case CustomerOutcome.CLOSED:
        status = ReferralStatus.CONVERTED;
        data.convertedAt = now;
        break;
      case CustomerOutcome.CLOSED_ELSEWHERE:
      case CustomerOutcome.NOT_CLOSING:
        status = ReferralStatus.LOST;
        data.closedAt = now;
        break;
      case CustomerOutcome.TALKING:
        status = ReferralStatus.CONNECTED;
        break;
      case CustomerOutcome.NOT_CONTACTED:
        data.adminNotes = "לקוח דיווח שלא נוצר קשר עם הספק — דורש מעקב.";
        break;
    }
    data.status = status;

    await prisma.referral.update({ where: { id }, data });

    logEventAsync({
      type: ActivityType.CUSTOMER_OUTCOME_REPORTED,
      actorType: "customer",
      actorId: session.id,
      customerId: session.id,
      supplierId: referral.supplierId,
      targetType: "Referral",
      targetId: id,
      payload: { outcome, amountIls: amountIls ?? null, previousStatus: referral.status, newStatus: status },
      meta: requestMeta(request),
    });

    return NextResponse.json({ success: true, data: { status } });
  } catch (err) {
    console.error("[POST /api/referrals/[id]/outcome]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
