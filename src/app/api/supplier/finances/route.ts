import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { MONTHLY_FEE_ILS } from "@/lib/payments";
import { computeSupplierBalance } from "@/lib/balance";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const supplierId = session.id;

    const [supplier, balance, recentEarned, recentOwed] =
      await Promise.all([
        prisma.supplier.findUnique({
          where: { id: supplierId },
          select: { subscriptionStatus: true, subscriptionStartAt: true },
        }),

        // Canonical balance (single source of truth)
        computeSupplierBalance(prisma, supplierId),

        // Recent transactions as referrer (last 20 combined, fetch 20 each then merge)
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

        // Recent transactions as receiver
        prisma.affiliateEarning.findMany({
          where: { receivingSupplierId: supplierId },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            amountIls: true,
            status: true,
            createdAt: true,
            meeting: { select: { requestedDate: true } },
            referringSupplier: { select: { name: true, category: true } },
          },
        }),
      ]);

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 }
      );
    }

    const { totalEarned, totalOwed, withdrawableBalance } = balance;
    const netBalance = totalEarned - totalOwed;

    // Merge and sort recent transactions, take last 20
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

    const owedTx = recentOwed.map((r) => ({
      id: r.id,
      type: "OWED" as const,
      amountIls: r.amountIls,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      counterpartName: r.referringSupplier.name,
      counterpartCategory: r.referringSupplier.category,
      meetingDate: r.meeting.requestedDate,
    }));

    const recentTransactions = [...earnedTx, ...owedTx]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      subscriptionStatus: supplier.subscriptionStatus,
      subscriptionStartAt: supplier.subscriptionStartAt?.toISOString() ?? null,
      monthlyFeeIls: MONTHLY_FEE_ILS,
      totalEarned,
      totalOwed,
      netBalance,
      withdrawableBalance,
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
