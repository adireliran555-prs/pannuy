import prisma from "@/lib/prisma";

/** Minimum profile for a supplier to appear in customer search. */
export function isSupplierListingReady(supplier: {
  name: string;
  category: string | null;
  photoCount: number;
}): boolean {
  return Boolean(supplier.name?.trim() && supplier.category && supplier.photoCount > 0);
}

/** Activate listing when the supplier has name, category, and at least one photo. */
export async function maybeActivateSupplierListing(supplierId: string): Promise<boolean> {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: {
      isActive: true,
      name: true,
      category: true,
      _count: { select: { photos: true } },
    },
  });

  if (!supplier || supplier.isActive) return supplier?.isActive ?? false;

  if (!isSupplierListingReady({ ...supplier, photoCount: supplier._count.photos })) {
    return false;
  }

  await prisma.supplier.update({
    where: { id: supplierId },
    data: { isActive: true },
  });

  return true;
}
