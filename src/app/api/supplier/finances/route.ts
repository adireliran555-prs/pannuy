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

      // Referral earnings (money in) — full detail for the referrals tab
      prisma.affiliateEarning.findMany({
        where: { referringSupplierId: supplierId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          amountIls: true,
          status: true,
          createdAt: true,
          paidAt: true,
          meeting: { select: { requestedDate: true } },
          receivingSupplier: { select: { name: true, category: true, slug: true } },
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

    // Detailed referral rows: who performed the job, the event date, amount, status.
    const referrals = recentEarned.map((r) => ({
      id: r.id,
      supplierName: r.receivingSupplier.name,
      supplierCategory: r.receivingSupplier.category,
      supplierSlug: r.receivingSupplier.slug,
      eventDate: r.meeting.requestedDate,
      amountIls: r.amountIls,
      status: r.status, // PENDING | CONFIRMED | PAID | CANCELLED
      createdAt: r.createdAt.toISOString(),
      paidAt: r.paidAt?.toISOString() ?? null,
    }));

    // Referral funnel counts
    const referralStats = {
      total: referrals.length,
      awaitingEvent: referrals.filter((x) => x.status === "PENDING").length,
      dueToYou: referrals.filter((x) => x.status === "CONFIRMED").length,
      paid: referrals.filter((x) => x.status === "PAID").length,
    };

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
      referrals,
      referralStats,
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
