// Daily sweep over active suppliers' text: redact any contact details that
// slipped through and warn the supplier. Called from the daily cron.

import prisma from "@/lib/prisma";
import { findPii, redactPii } from "@/lib/pii";
import { recordPiiViolation } from "@/lib/pii-warning";
import { delCache } from "@/lib/redis";

export interface PiiSweepResult {
  scanned: number;
  suppliersFlagged: number;
  fieldsRedacted: number;
  failed: number;
}

export async function runPiiSweep(limit = 1000): Promise<PiiSweepResult> {
  const result: PiiSweepResult = { scanned: 0, suppliersFlagged: 0, fieldsRedacted: 0, failed: 0 };

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

  return result;
}
