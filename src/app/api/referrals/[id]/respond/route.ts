import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ReferralStatus } from "@prisma/client";

// Public endpoint hit from the follow-up link/SMS: the customer tells us whether
// they actually connected with the supplier. The referral id (a UUID) acts as the
// capability token, so no session is required.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const answer = (body as { answer?: string }).answer;

    if (answer !== "connected" && answer !== "not_connected") {
      return NextResponse.json(
        { success: false, error: "answer לא תקין" },
        { status: 400 }
      );
    }

    const referral = await prisma.referral.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!referral) {
      return NextResponse.json(
        { success: false, error: "ההפניה לא נמצאה" },
        { status: 404 }
      );
    }

    // Don't re-open a referral that's already resolved.
    if (
      referral.status === ReferralStatus.CONVERTED ||
      referral.status === ReferralStatus.LOST
    ) {
      return NextResponse.json({ success: true, data: { status: referral.status } });
    }

    const connected = answer === "connected";
    await prisma.referral.update({
      where: { id },
      data: {
        status: connected ? ReferralStatus.CONNECTED : ReferralStatus.NO_ANSWER,
        customerConfirmedAt: new Date(),
        ...(connected
          ? {}
          : { adminNotes: "לקוח דיווח שעדיין לא נוצר קשר עם הספק — דורש מעקב." }),
      },
    });

    return NextResponse.json({
      success: true,
      data: { status: connected ? "CONNECTED" : "NO_ANSWER" },
    });
  } catch (err) {
    console.error("[POST /api/referrals/[id]/respond]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
