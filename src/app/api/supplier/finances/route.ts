import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { MONTHLY_FEE_ILS } from "@/lib/payments";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const supplierId = session.id;

    const [supplier, earnedRows, owedRows, recentEarned, recentOwed, payoutsAgg] =
      await Promise.all([
        prisma.supplier.findUnique({
          where: { id: supplierId },
          select: { subscriptionStatus: true, subscriptionStartAt: true },
        }),

        // Confirmed/paid earnings where this supplier is the referrer
        prisma.affiliateEarning.findMany({
          where: {
            referringSupplierId: supplierId,
            status: { in: ["CONFIRMED", "PAID"] },
          },
          select: { amountIls: true },
        }),

        // Confirmed/paid earnings where this supplier is the receiver (owes others)
        prisma.affiliateEarning.findMany({
          where: {
            receivingSupplierId: supplierId,
            status: { in: ["CONFIRMED", "PAID"] },
          },
          select: { amountIls: true },
        }),

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

        // Payout requests in flight or paid (reduce withdrawable balance)
        prisma.payoutRequest.aggregate({
          where: {
            supplierId,
            status: { in: ["PENDING", "APPROVED", "PAID"] },
          },
          _sum: { amountIls: true },
        }),
      ]);

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 }
      );
    }

    const totalEarned = earnedRows.reduce((sum, r) => sum + r.amountIls, 0);
    const totalOwed = owedRows.reduce((sum, r) => sum + r.amountIls, 0);
    const netBalance = totalEarned - totalOwed;

    const totalPayouts = payoutsAgg._sum.amountIls ?? 0;
    const subscriptionFee =
      supplier.subscriptionStatus === "ACTIVE" ? MONTHLY_FEE_ILS : 0;
    const withdrawableBalance =
      totalEarned - totalOwed - subscriptionFee - totalPayouts;

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
