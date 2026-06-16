import type { PrismaClient, Prisma } from "@prisma/client";

/**
 * A Prisma client that can be either the full client or an interactive
 * transaction client (the value passed to a `$transaction(async (tx) => ...)`
 * callback). Both expose the model accessors we need.
 */
export type PrismaLike = PrismaClient | Prisma.TransactionClient;

export interface SupplierBalance {
  /** Lifetime referral earnings (CONFIRMED + PAID) — money the platform owes/paid the supplier. */
  totalEarned: number;
  /** Referral earnings that are CONFIRMED and not yet attached to a payout — withdrawable now. */
  withdrawableBalance: number;
  /** Platform commission the supplier owes us on completed jobs (PENDING COMMISSION txns). */
  commissionOwed: number;
}

/**
 * THE single canonical balance for a supplier.
 *
 * Money model (current):
 *  - The supplier GETS PAID for referrals → AffiliateEarning where they are the
 *    referrer. A payout claims all CONFIRMED, unclaimed earnings (payoutRequestId
 *    = null), so the withdrawable balance is exactly that sum — no drift.
 *  - The supplier PAYS US a commission per completed job → PaymentTransaction of
 *    type COMMISSION (PENDING = still owed). Shown separately, not netted here.
 *  - Joining is free — no subscription fee.
 *
 * Accepts a Prisma client OR a transaction client so callers can recompute the
 * balance INSIDE a `$transaction` to prevent concurrent double-spend.
 */
export async function computeSupplierBalance(
  client: PrismaLike,
  supplierId: string
): Promise<SupplierBalance> {
  const [earnedLifetime, withdrawable, commission] = await Promise.all([
    client.affiliateEarning.aggregate({
      where: {
        referringSupplierId: supplierId,
        status: { in: ["CONFIRMED", "PAID"] },
      },
      _sum: { amountIls: true },
    }),
    // Withdrawable = CONFIRMED earnings not yet claimed by a payout request.
    client.affiliateEarning.aggregate({
      where: {
        referringSupplierId: supplierId,
        status: "CONFIRMED",
        payoutRequestId: null,
      },
      _sum: { amountIls: true },
    }),
    client.paymentTransaction.aggregate({
      where: { supplierId, type: "COMMISSION", status: "PENDING" },
      _sum: { amountIls: true },
    }),
  ]);

  return {
    totalEarned: earnedLifetime._sum.amountIls ?? 0,
    withdrawableBalance: withdrawable._sum.amountIls ?? 0,
    commissionOwed: commission._sum.amountIls ?? 0,
  };
}
