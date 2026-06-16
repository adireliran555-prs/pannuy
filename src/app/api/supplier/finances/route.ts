import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { computeSupplierBalance } from "@/lib/balance";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const supplierId = session.id;

    const [balance, recentEarned, recentCommission] = await Promise.all([
      // Canonical balance (single source of truth)
      computeSupplierBalance(prisma, supplierId),

      // Referral earnings (money in)
      prisma.affiliateEarning.findMany({
        where: { referringSupplierId: supplierId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          amountIls: true,
          status: true,
          createdAt: true,
          meeting: { select: { requestedDate: true } },
          receivingSupplier: { select: { name: true, category: true } },
        },
      }),

      // Platform commissions owed/paid on completed jobs (money out)
      prisma.paymentTransaction.findMany({
        where: { supplierId, type: "COMMISSION" },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, amountIls: true, status: true, createdAt: true },
      }),
    ]);

    const { totalEarned, withdrawableBalance, commissionOwed } = balance;

    const earnedTx = recentEarned.map((r) => ({
      id: r.id,
      type: "EARNED" as const,
      amountIls: r.amountIls,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      counterpartName: r.receivingSupplier.name,
      counterpartCategory: r.receivingSupplier.category,
      meetingDate: r.meeting.requestedDate,
    }));

    const commissionTx = recentCommission.map((c) => ({
      id: c.id,
      type: "COMMISSION" as const,
      amountIls: c.amountIls,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      counterpartName: "פנוי",
      counterpartCategory: null as string | null,
      meetingDate: c.createdAt,
    }));

    const recentTransactions = [...earnedTx, ...commissionTx]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      totalEarned,
      withdrawableBalance,
      commissionOwed,
      recentTransactions,
    });
  } catch (err) {
    console.error("[GET /api/supplier/finances]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
