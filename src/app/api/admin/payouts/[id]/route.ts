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

  const now = new Date();
  const processedAt =
    status === "PAID" || status === "REJECTED" || status === "APPROVED"
      ? now
      : null;

  try {
    const payout = await prisma.$transaction(async (tx) => {
      const current = await tx.payoutRequest.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!current) {
        throw new Error("PAYOUT_NOT_FOUND");
      }
      // PAID is terminal — never let a disbursed payout be reverted (that would
      // restore withdrawable balance for money already paid out).
      if (current.status === "PAID" && status !== "PAID") {
        throw new Error("PAID_IS_TERMINAL");
      }
      // Idempotency: only run the PAID side-effects on the transition INTO PAID.
      const isNewlyPaid = status === "PAID" && current.status !== "PAID";

      const updated = await tx.payoutRequest.update({
        where: { id },
        data: { status, processedAt },
        select: {
          id: true,
          supplierId: true,
          amountIls: true,
          status: true,
          processedAt: true,
        },
      });

      if (isNewlyPaid) {
        // Settle the supplier's CONFIRMED affiliate earnings (as referrer) up to
        // the payout amount, oldest first, flipping them to PAID.
        const confirmed = await tx.affiliateEarning.findMany({
          where: {
            referringSupplierId: updated.supplierId,
            status: "CONFIRMED",
          },
          orderBy: { createdAt: "asc" },
          select: { id: true, amountIls: true },
        });

        let remaining = updated.amountIls;
        const toSettle: string[] = [];
        for (const earning of confirmed) {
          if (remaining <= 0) break;
          // Only settle a row that fits whole within the remaining amount; never
          // partially settle an earning.
          if (earning.amountIls > remaining) continue;
          toSettle.push(earning.id);
          remaining -= earning.amountIls;
        }

        if (toSettle.length > 0) {
          await tx.affiliateEarning.updateMany({
            where: { id: { in: toSettle } },
            data: { status: "PAID", paidAt: now },
          });
        }

        // Record the disbursement as a completed PAYOUT transaction.
        await tx.paymentTransaction.create({
          data: {
            supplierId: updated.supplierId,
            type: "PAYOUT",
            amountIls: updated.amountIls,
            status: "COMPLETED",
            settledAt: now,
          },
        });
      }

      return updated;
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
    if (err instanceof Error && err.message === "PAYOUT_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "בקשת משיכה לא נמצאה" },
        { status: 404 }
      );
    }
    if (err instanceof Error && err.message === "PAID_IS_TERMINAL") {
      return NextResponse.json(
        { success: false, error: "לא ניתן לשנות סטטוס של משיכה ששולמה" },
        { status: 400 }
      );
    }
    console.error("[PATCH /api/admin/payouts/[id]]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
