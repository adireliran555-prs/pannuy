import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/api-auth";
import { ReferralStatus } from "@prisma/client";

// Admin updates a referral's status and/or notes from the tracking board.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = requireAdminSession(request);
    if (error) return error;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { status, adminNotes } = body as {
      status?: string;
      adminNotes?: string;
    };

    const data: {
      status?: ReferralStatus;
      adminNotes?: string;
      convertedAt?: Date;
      closedAt?: Date;
    } = {};

    if (status) {
      if (!Object.values(ReferralStatus).includes(status as ReferralStatus)) {
        return NextResponse.json(
          { success: false, error: "סטטוס לא תקין" },
          { status: 400 }
        );
      }
      data.status = status as ReferralStatus;
      if (status === ReferralStatus.CONVERTED) data.convertedAt = new Date();
      if (status === ReferralStatus.LOST) data.closedAt = new Date();
    }

    if (typeof adminNotes === "string") data.adminNotes = adminNotes;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, error: "אין מה לעדכן" },
        { status: 400 }
      );
    }

    const updated = await prisma.referral.update({
      where: { id },
      data,
      select: { id: true, status: true, adminNotes: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /api/admin/referrals/[id]]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
