// Records a supplier's attempt to publish contact details: SupplierWarning +
// warningCount (2 → listing deactivated, same policy as admin warnings), an
// in-app notification, and an append-only ActivityEvent.

import prisma from "@/lib/prisma";
import { logEventAsync, ActivityType } from "@/lib/activity";
import type { PiiHit } from "@/lib/pii";

export type PiiSource = "save" | "sweep" | "photo";

const WARNING_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const FIELD_LABELS: Record<string, string> = {
  name: "שם",
  bioHe: "אודות",
  meetingAddress: "כתובת פגישה",
  nameHe: "שם חבילה",
  descHe: "תיאור חבילה",
  includes: "פירוט חבילה",
  photo: "תמונה",
};

export async function recordPiiViolation(
  supplierId: string,
  opts: { field: string; hits: PiiHit[]; source: PiiSource; meta?: { ip?: string | null; userAgent?: string | null; sessionId?: string | null } }
): Promise<{ warned: boolean; warningCount: number; deactivated: boolean }> {
  const fieldLabel = FIELD_LABELS[opts.field] ?? opts.field;
  const kinds = Array.from(new Set(opts.hits.map((h) => h.kind)));

  logEventAsync({
    type: ActivityType.PII_VIOLATION,
    actorType: opts.source === "sweep" ? "system" : "supplier",
    actorId: opts.source === "sweep" ? null : supplierId,
    supplierId,
    targetType: "supplier",
    targetId: supplierId,
    payload: { field: opts.field, source: opts.source, kinds, matches: opts.hits.slice(0, 10).map((h) => h.match) },
    meta: opts.meta ?? null,
  });

  const latest = await prisma.supplierWarning.findFirst({
    where: { supplierId, reasonHe: { startsWith: "ניסיון לפרסם פרטי התקשרות" } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const current = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { warningCount: true, isActive: true },
  });
  if (!current) return { warned: false, warningCount: 0, deactivated: false };

  if (latest && Date.now() - latest.createdAt.getTime() < WARNING_COOLDOWN_MS) {
    return { warned: false, warningCount: current.warningCount, deactivated: !current.isActive };
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.supplierWarning.create({
      data: { supplierId, reasonHe: `ניסיון לפרסם פרטי התקשרות בפרופיל: ${fieldLabel}` },
    });
    const updated = await tx.supplier.update({
      where: { id: supplierId },
      data: { warningCount: { increment: 1 } },
      select: { warningCount: true },
    });
    const deactivated = updated.warningCount >= 2;
    if (deactivated) {
      await tx.supplier.update({ where: { id: supplierId }, data: { isActive: false } });
    }
    await tx.notification.create({
      data: {
        supplierId,
        type: "PII_WARNING",
        titleHe: "אזהרה: פרטי התקשרות בפרופיל",
        bodyHe: deactivated
          ? `זוהו פרטי התקשרות (${fieldLabel}). זו האזהרה השנייה — הפרופיל הוסר מהחיפוש. פנו אלינו להסדרה.`
          : `זוהו פרטי התקשרות (${fieldLabel}). הקשר עם לקוחות נעשה דרך פגישת היכרות באתר בלבד. אזהרה נוספת תגרום להסרת הפרופיל מהחיפוש.`,
        metadata: { field: opts.field, source: opts.source },
      },
    });
    return { warningCount: updated.warningCount, deactivated };
  });

  return { warned: true, ...result };
}
