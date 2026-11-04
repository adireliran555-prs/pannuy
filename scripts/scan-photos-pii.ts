// Maintenance: OCR-scan supplier photos for contact details and apply results
// (CLEAN / delete+warn). Usage: npx tsx scripts/scan-photos-pii.ts [--slug=<slug>] [--dry] [--all]
// Without --all only PENDING/LEGACY photos are scanned.
import prisma from "@/lib/prisma";
import { scanPhotoRecord } from "@/lib/photo-pii";

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => a.startsWith("--slug="))?.split("=")[1];
  const dry = args.includes("--dry");
  const all = args.includes("--all");
  const photos = await prisma.supplierPhoto.findMany({
    where: {
      ...(slug ? { supplier: { slug } } : {}),
      ...(all ? {} : { piiScanStatus: { in: ["PENDING", "LEGACY"] } }),
    },
    select: { id: true, supplierId: true, cloudinaryUrl: true, publicId: true, type: true, piiScanStatus: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`scanning ${photos.length} photos${slug ? ` for ${slug}` : ""}${dry ? " (dry run)" : ""}`);
  let flagged = 0, clean = 0, unavailable = 0;
  for (const p of photos) {
    const r = await scanPhotoRecord(p, { source: "sweep", dry });
    if (r.status === "unavailable") {
      unavailable++;
      console.log(`  UNAVAILABLE ${p.id} (${r.reason})`);
      if (r.reason === "quota_exhausted") { console.log("  OCR quota exhausted — stopping"); break; }
      continue;
    }
    if (r.status === "flagged") { flagged++; console.log(`  HIT  ${p.type} ${p.id} -> ${r.matched}`); }
    else clean++;
  }
  console.log(JSON.stringify({ scanned: photos.length, clean, flagged, unavailable }));
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
