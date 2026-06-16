import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";

async function computeAvailableBalance(supplierId: string): Promise<number> {
  const [earned, owed, payouts] = await Promise.all([
    // Earnings where this supplier is the referrer (money coming in)
    prisma.affiliateEarning.aggregate({
      where: {
        referringSupplierId: supplierId,
        status: { in: ["CONFIRMED", "PAID"] },
      },
      _sum: { amountIls: true },
    }),
    // Earnings where this supplier is the receiver (money owed out)
    prisma.affiliateEarning.aggregate({
      where: {
        receivingSupplierId: supplierId,
        status: { in: ["CONFIRMED", "PAID"] },
      },
      _sum: { amountIls: true },
    }),
    // Payout requests already in flight or paid
    prisma.payoutRequest.aggregate({
      where: {
        supplierId,
        status: { in: ["PENDING", "APPROVED", "PAID"] },
      },
      _sum: { amountIls: true },
    }),
  ]);

  const totalEarned = earned._sum.amountIls ?? 0;
  const totalOwed = owed._sum.amountIls ?? 0;
  const totalPayouts = payouts._sum.amountIls ?? 0;

  return totalEarned - totalOwed - totalPayouts;
}

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const supplierId = session.id;

    const [availableBalance, payouts] = await Promise.all([
      computeAvailableBalance(supplierId),
      prisma.payoutRequest.findMany({
        where: { supplierId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          amountIls: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      availableBalance,
      payouts: payouts.map((p) => ({
        id: p.id,
        amountIls: p.amountIls,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[GET /api/supplier/payouts]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const supplierId = session.id;
    const body = await request.json();
    const { amountIls } = body as { amountIls?: number };

    if (typeof amountIls !== "number" || !Number.isFinite(amountIls) || amountIls <= 0) {
      return NextResponse.json(
        { success: false, error: "סכום המשיכה חייב להיות גדול מאפס" },
        { status: 400 }
      );
    }

    const availableBalance = await computeAvailableBalance(supplierId);

    if (amountIls > availableBalance) {
      return NextResponse.json(
        { success: false, error: "סכום המשיכה גבוה מהיתרה הזמינה" },
        { status: 400 }
      );
    }

    const payout = await prisma.payoutRequest.create({
      data: {
        supplierId,
        amountIls,
        status: "PENDING",
      },
      select: {
        id: true,
        amountIls: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        amountIls: payout.amountIls,
        status: payout.status,
        createdAt: payout.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[POST /api/supplier/payouts]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
