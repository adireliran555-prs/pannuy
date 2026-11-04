// Daily sweep over active suppliers' text: redact any contact details that
// slipped through and warn the supplier. Called from the daily cron.

import prisma from "@/lib/prisma";
import { findPii, redactPii } from "@/lib/pii";
import { recordPiiViolation } from "@/lib/pii-warning";
import { delCache } from "@/lib/redis";
import { scanPhotoRecord } from "@/lib/photo-pii";

export interface PiiSweepResult {
  scanned: number;
  suppliersFlagged: number;
  fieldsRedacted: number;
  failed: number;
  photosScanned: number;
  photosFlagged: number;
  photosPending: number;
  quotaExhausted: boolean;
}

/**
 * Scans photos awaiting review within a per-run OCR budget (the Cloudinary OCR
 * add-on has a small monthly quota). PENDING (hidden) first, then LEGACY.
 * Stops at the first "unavailable" result — the quota is gone for today.
 */
export async function runPhotoSweep(
  budget = Number(process.env.PHOTO_SCAN_BUDGET ?? 40)
): Promise<Pick<PiiSweepResult, "photosScanned" | "photosFlagged" | "photosPending" | "quotaExhausted">> {
  const out = { photosScanned: 0, photosFlagged: 0, photosPending: 0, quotaExhausted: false };
  const queue = await prisma.supplierPhoto.findMany({
    where: { piiScanStatus: { in: ["PENDING", "LEGACY"] } },
    orderBy: { createdAt: "asc" },
    take: Math.max(budget, 1) * 4,
    select: { id: true, cloudinaryUrl: true, publicId: true, supplierId: true, piiScanStatus: true },
  });
  queue.sort((a, b) =>
    a.piiScanStatus === b.piiScanStatus ? 0 : a.piiScanStatus === "PENDING" ? -1 : 1
  );
  for (const photo of queue) {
    if (out.photosScanned >= budget) break;
    try {
      const r = await scanPhotoRecord(photo, { source: "sweep" });
      if (r.status === "unavailable") {
        out.quotaExhausted = r.reason === "quota_exhausted" || out.quotaExhausted;
        console.warn("[pii-sweep] OCR unavailable:", r.reason);
        break;
      }
      out.photosScanned++;
      if (r.status === "flagged") out.photosFlagged++;
    } catch (err) {
      console.error("[pii-sweep] photo", photo.id, err);
    }
  }
  out.photosPending = await prisma.supplierPhoto.count({ where: { piiScanStatus: "PENDING" } });
  return out;
}

export async function runPiiSweep(limit = 1000): Promise<PiiSweepResult> {
  const result: PiiSweepResult = {
    scanned: 0,
    suppliersFlagged: 0,
    fieldsRedacted: 0,
    failed: 0,
    photosScanned: 0,
    photosFlagged: 0,
    photosPending: 0,
    quotaExhausted: false,
  };

  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    take: limit,
    select: {
      id: true,
      slug: true,
      name: true,
      bioHe: true,
      meetingAddress: true,
      packages: { select: { id: true, nameHe: true, descHe: true, includes: true } },
    },
  });

  for (const s of suppliers) {
    result.scanned++;
    try {
      let flaggedField: string | null = null;
      let hits = findPii(s.name);
      const supplierData: Record<string, string> = {};
      if (hits.length) {
        supplierData.name = redactPii(s.name) || "ספק";
        flaggedField ??= "name";
      }
      const bioHits = findPii(s.bioHe);
      if (bioHits.length) {
        supplierData.bioHe = redactPii(s.bioHe);
        hits = hits.concat(bioHits);
        flaggedField ??= "bioHe";
      }
      const addrHits = findPii(s.meetingAddress);
      if (addrHits.length) {
        supplierData.meetingAddress = redactPii(s.meetingAddress);
        hits = hits.concat(addrHits);
        flaggedField ??= "meetingAddress";
      }
      if (Object.keys(supplierData).length) {
        await prisma.supplier.update({ where: { id: s.id }, data: supplierData });
        result.fieldsRedacted += Object.keys(supplierData).length;
      }

      for (const p of s.packages) {
        const pkgData: Record<string, string | string[]> = {};
        const nh = findPii(p.nameHe);
        if (nh.length) {
          pkgData.nameHe = redactPii(p.nameHe) || "חבילה";
          hits = hits.concat(nh);
          flaggedField ??= "nameHe";
        }
        const dh = findPii(p.descHe);
        if (dh.length) {
          pkgData.descHe = redactPii(p.descHe);
          hits = hits.concat(dh);
          flaggedField ??= "descHe";
        }
        const ih = p.includes.flatMap((t) => findPii(t));
        if (ih.length) {
          pkgData.includes = p.includes.map((t) => redactPii(t));
          hits = hits.concat(ih);
          flaggedField ??= "includes";
        }
        if (Object.keys(pkgData).length) {
          await prisma.supplierPackage.update({ where: { id: p.id }, data: pkgData });
          result.fieldsRedacted += Object.keys(pkgData).length;
        }
      }

      if (flaggedField) {
        result.suppliersFlagged++;
        await recordPiiViolation(s.id, { field: flaggedField, hits, source: "sweep" });
        await delCache(`supplier:${s.slug}`).catch(() => {});
      }
    } catch (err) {
      console.error("[pii-sweep] supplier", s.id, err);
      result.failed++;
    }
  }

  try {
    Object.assign(result, await runPhotoSweep());
  } catch (err) {
    console.error("[pii-sweep] photo pass", err);
  }

  return result;
}
