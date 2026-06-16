import type { PrismaClient, Prisma } from "@prisma/client";

/**
 * A Prisma client that can be either the full client or an interactive
 * transaction client (the value passed to a `$transaction(async (tx) => ...)`
 * callback). Both expose the model accessors we need.
 */
export type PrismaLike = PrismaClient | Prisma.TransactionClient;

export interface SupplierBalance {
  /** Sum of CONFIRMED+PAID earnings where this supplier is the referrer (money in). */
  totalEarned: number;
  /** Sum of CONFIRMED+PAID earnings where this supplier is the receiver (money out). */
  totalOwed: number;
  /** Sum of PENDING+APPROVED+PAID payout requests already in flight. */
  pendingPayouts: number;
  /** What the supplier may still withdraw: earned - owed - pendingPayouts. */
  withdrawableBalance: number;
}

/**
 * THE single canonical balance formula for a supplier.
 *
 * Product decision: joining is free — no monthly subscription fee is subtracted.
 *
 * Accepts a Prisma client OR a transaction client so callers can recompute the
 * balance INSIDE a `$transaction` to prevent concurrent double-spend.
 */
export async function computeSupplierBalance(
  client: PrismaLike,
  supplierId: string
): Promise<SupplierBalance> {
  const [earned, owed, payouts] = await Promise.all([
    // Earnings where this supplier is the referrer (money coming in)
    client.affiliateEarning.aggregate({
      where: {
        referringSupplierId: supplierId,
        status: { in: ["CONFIRMED", "PAID"] },
      },
      _sum: { amountIls: true },
    }),
    // Earnings where this supplier is the receiver (money owed out)
    client.affiliateEarning.aggregate({
      where: {
        receivingSupplierId: supplierId,
        status: { in: ["CONFIRMED", "PAID"] },
      },
      _sum: { amountIls: true },
    }),
    // Payout requests already in flight or paid
    client.payoutRequest.aggregate({
      where: {
        supplierId,
        status: { in: ["PENDING", "APPROVED", "PAID"] },
      },
      _sum: { amountIls: true },
    }),
  ]);

  const totalEarned = earned._sum.amountIls ?? 0;
  const totalOwed = owed._sum.amountIls ?? 0;
  const pendingPayouts = payouts._sum.amountIls ?? 0;
  const withdrawableBalance = totalEarned - totalOwed - pendingPayouts;

  return { totalEarned, totalOwed, pendingPayouts, withdrawableBalance };
}
