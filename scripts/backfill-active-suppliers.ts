/**
 * One-off: activate suppliers who already have a complete profile but isActive=false.
 * Run: npx tsx scripts/backfill-active-suppliers.ts
 */
import prisma from "../src/lib/prisma";
import { isSupplierListingReady } from "../src/lib/supplier-activation";

async function main() {
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: false },
    select: {
      id: true,
      name: true,
      category: true,
      _count: { select: { photos: true } },
    },
  });

  let activated = 0;
  for (const s of suppliers) {
    if (
      isSupplierListingReady({
        name: s.name,
        category: s.category,
        photoCount: s._count.photos,
      })
    ) {
      await prisma.supplier.update({
        where: { id: s.id },
        data: { isActive: true },
      });
      activated++;
    }
  }

  console.log(`Activated ${activated} of ${suppliers.length} inactive suppliers`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
