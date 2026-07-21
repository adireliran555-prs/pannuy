"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { PlanItemDTO } from "@/types/event";
import type { PyramidStep } from "@/lib/event-planning";
import { formatIls } from "@/lib/event-planning";
import { CATEGORY_LABELS } from "@/lib/categories";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import StatusBadge from "./StatusBadge";

interface PyramidTierProps {
  item: PlanItemDTO;
  step: PyramidStep;
}

/** One category row on the plan dashboard. Links into its category step,
 *  unless the tier is marked NOT_NEEDED (dimmed, non-interactive). */
export default function PyramidTier({ item, step }: PyramidTierProps) {
  const clickable = item.status !== "NOT_NEEDED";
  const label = CATEGORY_LABELS[item.category] ?? item.category;

  const sub =
    item.status === "SELECTED" && item.selectedSupplier
      ? [item.selectedSupplier.name, item.selectedPackage?.nameHe]
          .filter(Boolean)
          .join(" · ")
      : step.tagline;

  const row = (
    <Card
      padding="sm"
      hover={clickable}
      className={cn(!clickable && "opacity-60")}
    >
      <div className="flex items-center gap-3">
        {/* Emoji tile */}
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-light text-xl">
          {step.emoji}
        </div>

        {/* Name + sub */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-bold text-text-main">{label}</h3>
            {!step.essential && (
              <Badge variant="default" size="sm">
                רשות
              </Badge>
            )}
          </div>
          <p className="truncate text-sm text-text-muted">{sub}</p>
        </div>

        {/* Status + amount */}
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <StatusBadge status={item.status} />
          {item.status === "SELECTED" && item.committedPrice != null ? (
            <span dir="ltr" className="text-sm font-semibold text-text-main">
              {formatIls(item.committedPrice)}
            </span>
          ) : (
            item.allocatedBudget != null && (
              <span className="text-xs text-text-muted">
                תקציב מומלץ{" "}
                <span dir="ltr">≈ {formatIls(item.allocatedBudget)}</span>
              </span>
            )
          )}
        </div>

        {clickable && (
          <ChevronLeft className="h-5 w-5 flex-shrink-0 text-text-muted" />
        )}
      </div>
    </Card>
  );

  if (clickable) {
    return (
      <Link href={`/plan/${item.category}`} className="block">
        {row}
      </Link>
    );
  }
  return row;
}
