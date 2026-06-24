/**
 * Remove seeded demo suppliers (Unsplash photos, @example.com emails).
 * Run: npx dotenv -e .env.local -- tsx scripts/remove-mock-suppliers.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";

const MOCK_SLUGS = [
  "dana-cohen",
  "michal-levy",
  "shira-avraham",
  "noa-golan",
  "tal-shapira",
  "oren-dayan",
  "rachel-ben-david",
  "yael-mizrahi",
];

async function main() {
  const mockSuppliers = await prisma.supplier.findMany({
    where: {
      OR: [
        { slug: { in: MOCK_SLUGS } },
        { email: { endsWith: "@example.com" } },
        { photos: { some: { cloudinaryUrl: { contains: "unsplash.com" } } } },
      ],
    },
    select: { id: true, slug: true, name: true },
  });

  if (mockSuppliers.length === 0) {
    console.log("No mock suppliers found.");
    return;
  }

  console.log(`Removing ${mockSuppliers.length} mock suppliers:`);
  for (const s of mockSuppliers) {
    console.log(`  - ${s.name} (${s.slug})`);
  }

  const ids = mockSuppliers.map((s) => s.id);

  await prisma.review.deleteMany({ where: { supplierId: { in: ids } } });
  await prisma.meeting.deleteMany({ where: { supplierId: { in: ids } } });
  await prisma.savedSupplier.deleteMany({ where: { supplierId: { in: ids } } });
  await prisma.availabilitySlot.deleteMany({ where: { supplierId: { in: ids } } });
  await prisma.supplierPackage.deleteMany({ where: { supplierId: { in: ids } } });
  await prisma.supplierPhoto.deleteMany({ where: { supplierId: { in: ids } } });
  await prisma.profileView.deleteMany({ where: { supplierId: { in: ids } } });
  await prisma.supplier.deleteMany({ where: { id: { in: ids } } });

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
