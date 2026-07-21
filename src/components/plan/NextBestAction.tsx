"use client";

import Link from "next/link";
import type { PlanItemDTO } from "@/types/event";
import { PLAN_PYRAMID, getPyramidStep } from "@/lib/event-planning";
import { CATEGORY_LABELS, CATEGORY_LABELS_SINGULAR } from "@/lib/categories";
import Button from "@/components/ui/Button";

interface NextBestActionProps {
  items: PlanItemDTO[];
}

/** Picks the most valuable next step (first pyramid category still open),
 *  in pyramid order. Renders nothing when nothing is actionable. */
function pickNext(items: PlanItemDTO[]): PlanItemDTO | null {
  const byCat = new Map(items.map((i) => [i.category, i]));
  // First priority: a category the couple hasn't touched yet.
  for (const step of PLAN_PYRAMID) {
    const item = byCat.get(step.category);
    if (item && (item.status === "PENDING" || item.status === "BROWSING")) {
      return item;
    }
  }
  // Fallback: a skipped essential still worth revisiting.
  for (const step of PLAN_PYRAMID) {
    if (!step.essential) continue;
    const item = byCat.get(step.category);
    if (item && item.status === "SKIPPED") return item;
  }
  return null;
}

export default function NextBestAction({ items }: NextBestActionProps) {
  const item = pickNext(items);
  if (!item) return null;

  const step = getPyramidStep(item.category);
  const label = CATEGORY_LABELS[item.category] ?? item.category;
  const singular = CATEGORY_LABELS_SINGULAR[item.category] ?? label;

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary-light to-accent-warm p-6 shadow-[var(--shadow-card)]">
      <p className="text-xs font-black uppercase tracking-widest text-primary">
        הצעד הבא שלכם
      </p>
      <p className="mt-2 text-xl font-black text-text-main">
        {step?.emoji} {label}
      </p>
      {step?.tagline && (
        <p className="mt-1 text-sm text-text-muted">{step.tagline}</p>
      )}
      <Link href={`/plan/${item.category}`} className="mt-4 inline-block">
        <Button variant="primary">בואו נבחר {singular}</Button>
      </Link>
    </div>
  );
}
