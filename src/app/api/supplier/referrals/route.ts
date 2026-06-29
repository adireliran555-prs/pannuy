import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";

// Leads referred to this supplier by the platform. We deliberately do NOT expose
// the customer's phone — suppliers connect through the app, never by phone.
export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const referrals = await prisma.referral.findMany({
      where: { supplierId: session.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        status: true,
        channel: true,
        createdAt: true,
        meetingId: true,
        customer: { select: { name: true } },
      },
    });

    const data = referrals.map((r) => ({
      id: r.id,
      status: r.status,
      channel: r.channel,
      createdAt: r.createdAt.toISOString(),
      hasMeeting: Boolean(r.meetingId),
      // First name only — enough to personalize, without leaking contact details.
      customerFirstName: r.customer?.name?.split(" ")[0] ?? "לקוח",
    }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[GET /api/supplier/referrals]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
