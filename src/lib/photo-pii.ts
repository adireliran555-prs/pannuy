// Scan a stored SupplierPhoto for contact details and apply the result:
// clean → mark CLEAN; flagged → delete row + asset and warn the supplier;
// unavailable (OCR quota/outage) → leave status untouched so the sweep retries.

import prisma from "@/lib/prisma";
import { scanImageForPhone, deleteCloudinaryAsset, type ScanStatus } from "@/lib/cloudinary-ocr";
import { recordPiiViolation, type PiiSource } from "@/lib/pii-warning";
import { firstPii } from "@/lib/pii";
import { delCache } from "@/lib/redis";
import type { PiiScanStatus } from "@prisma/client";

/** Photo statuses customers are allowed to see. */
export const PUBLIC_PHOTO_STATUSES: PiiScanStatus[] = ["CLEAN", "LEGACY"];
export const PUBLIC_PHOTO_WHERE = { piiScanStatus: { in: PUBLIC_PHOTO_STATUSES } } as const;

export interface PhotoRecord {
  id: string;
  cloudinaryUrl: string;
  publicId: string;
  supplierId: string;
}

export interface PhotoScanOutcome {
  status: ScanStatus;
  matched?: string;
  reason?: string;
}

export async function scanPhotoRecord(
  photo: PhotoRecord,
  opts: { source?: PiiSource; dry?: boolean } = {}
): Promise<PhotoScanOutcome> {
  const scan = await scanImageForPhone(photo.cloudinaryUrl);
  if (opts.dry) return { status: scan.status, matched: scan.matched, reason: scan.reason };

  if (scan.status === "clean") {
    await prisma.supplierPhoto.update({
      where: { id: photo.id },
      data: { piiScanStatus: "CLEAN", piiScannedAt: new Date() },
    });
    return { status: "clean" };
  }

  if (scan.status === "flagged") {
    // Phone/email printed on an image is a clear violation → delete + warn.
    // A bare URL/handle is often a brand printed on a product (e.g. a stationery
    // logo), so hide the photo for admin review instead of punishing the supplier.
    const kind = firstPii(scan.matched)?.kind ?? "phone";
    if (kind === "url" || kind === "social") {
      await prisma.supplierPhoto.update({
        where: { id: photo.id },
        data: { piiScanStatus: "FLAGGED", piiScannedAt: new Date() },
      }).catch(() => {});
      const s = await prisma.supplier.findUnique({ where: { id: photo.supplierId }, select: { slug: true } });
      if (s) await delCache(`supplier:${s.slug}`).catch(() => {});
      return { status: "flagged", matched: scan.matched };
    }
    await prisma.supplierPhoto.delete({ where: { id: photo.id } }).catch(() => {});
    await deleteCloudinaryAsset(photo.publicId).catch(() => {});
    await recordPiiViolation(photo.supplierId, {
      field: "photo",
      hits: [{ kind, match: scan.matched ?? "", index: 0 }],
      source: opts.source ?? "sweep",
    }).catch((e) => console.error("[photo-pii] warn failed", e));
    const s = await prisma.supplier.findUnique({ where: { id: photo.supplierId }, select: { slug: true } });
    if (s) await delCache(`supplier:${s.slug}`).catch(() => {});
    return { status: "flagged", matched: scan.matched };
  }

  return { status: "unavailable", reason: scan.reason };
}
