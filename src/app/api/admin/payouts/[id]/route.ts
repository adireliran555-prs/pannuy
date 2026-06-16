import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/api-auth";

const ALLOWED_STATUSES = ["PENDING", "APPROVED", "PAID", "REJECTED"] as const;
type PayoutStatus = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminSession(request);
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const status = body.status as PayoutStatus | undefined;
  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { success: false, error: "סטטוס לא תקין" },
      { status: 400 }
    );
  }

  const processedAt =
    status === "PAID" || status === "REJECTED" || status === "APPROVED"
      ? new Date()
      : null;

  try {
    const payout = await prisma.payoutRequest.update({
      where: { id },
      data: { status, processedAt },
      select: {
        id: true,
        status: true,
        processedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        status: payout.status,
        processedAt: payout.processedAt?.toISOString() ?? null,
      },
    });
  } catch (err) {
    console.error("[PATCH /api/admin/payouts/[id]]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
