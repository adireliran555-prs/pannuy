import prisma from "@/lib/prisma";
import { delCache, delCachePattern } from "@/lib/redis";

export class SupplierNotFoundError extends Error {
  constructor() {
    super("NOT_FOUND");
    this.name = "SupplierNotFoundError";
  }
}

/** Permanently removes a supplier and dependent rows that block FK constraints. */
export async function deleteSupplierPermanently(supplierId: string): Promise<{ slug: string }> {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { id: true, slug: true },
  });
  if (!supplier) throw new SupplierNotFoundError();

  await prisma.$transaction(async (tx) => {
    const meetings = await tx.meeting.findMany({
      where: { supplierId },
      select: { id: true },
    });
    const meetingIds = meetings.map((m) => m.id);

    if (meetingIds.length > 0) {
      await tx.affiliateEarning.deleteMany({ where: { meetingId: { in: meetingIds } } });
      await tx.review.deleteMany({ where: { meetingId: { in: meetingIds } } });
      await tx.meeting.deleteMany({ where: { id: { in: meetingIds } } });
    }

    await tx.affiliateEarning.deleteMany({
      where: {
        OR: [{ referringSupplierId: supplierId }, { receivingSupplierId: supplierId }],
      },
    });
    await tx.review.deleteMany({ where: { supplierId } });
    await tx.savedSupplier.deleteMany({ where: { supplierId } });
    await tx.notification.deleteMany({ where: { supplierId } });
    await tx.meeting.updateMany({
      where: { referredBySupplierId: supplierId },
      data: { referredBySupplierId: null },
    });

    await tx.supplier.delete({ where: { id: supplierId } });
  });

  await delCache(`supplier:${supplier.slug}`);
  await delCachePattern(`availability:${supplierId}:*`);

  return { slug: supplier.slug };
}
