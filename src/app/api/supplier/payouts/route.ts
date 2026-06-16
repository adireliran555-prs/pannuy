import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { computeSupplierBalance } from "@/lib/balance";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const supplierId = session.id;

    const [balance, payouts] = await Promise.all([
      computeSupplierBalance(prisma, supplierId),
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
      availableBalance: balance.withdrawableBalance,
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

    // Recompute the balance and create the request inside ONE transaction so
    // concurrent payout requests cannot double-spend the same balance.
    const result = await prisma.$transaction(async (tx) => {
      const { withdrawableBalance } = await computeSupplierBalance(
        tx,
        supplierId
      );

      if (amountIls > withdrawableBalance) {
        return { ok: false as const };
      }

      const payout = await tx.payoutRequest.create({
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

      return { ok: true as const, payout };
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: "סכום המשיכה גבוה מהיתרה הזמינה" },
        { status: 400 }
      );
    }

    const { payout } = result;

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
