import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

    // Recompute the balance and create the request inside ONE Serializable
    // transaction so concurrent payout requests cannot double-spend the same
    // balance (READ COMMITTED would let both reads see the pre-insert balance).
    // Retry a few times on serialization failure (40001 / P2034).
    const runTxn = () =>
      prisma.$transaction(
        async (tx) => {
          const { withdrawableBalance } = await computeSupplierBalance(
            tx,
            supplierId
          );

          if (amountIls > withdrawableBalance) {
            return { ok: false as const };
          }

          const payout = await tx.payoutRequest.create({
            data: { supplierId, amountIls, status: "PENDING" },
            select: { id: true, amountIls: true, status: true, createdAt: true },
          });

          return { ok: true as const, payout };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );

    let result: Awaited<ReturnType<typeof runTxn>> | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await runTxn();
        break;
      } catch (txErr) {
        // P2034 = serialization/deadlock conflict — a concurrent payout won the
        // race; retry so this request re-reads the now-reduced balance.
        if (
          txErr instanceof Prisma.PrismaClientKnownRequestError &&
          txErr.code === "P2034" &&
          attempt < 2
        ) {
          continue;
        }
        throw txErr;
      }
    }

    if (!result || !result.ok) {
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
