"use client";

import Link from "next/link";
import type { PlanItemDTO } from "@/types/event";
import { getPyramidStep } from "@/lib/event-planning";
import { CATEGORY_LABELS } from "@/lib/categories";
import Badge from "@/components/ui/Badge";
import StatusBadge from "./StatusBadge";

interface GapListProps {
  items: PlanItemDTO[];
}

/** Lists the open gaps in the plan: skipped items, plus still-pending
 *  essentials. NOT_NEEDED and SELECTED never count as gaps. */
export default function GapList({ items }: GapListProps) {
  const gaps = items
    .filter((item) => {
      if (item.status === "SKIPPED") return true;
      if (item.status === "PENDING" || item.status === "BROWSING") {
        return getPyramidStep(item.category)?.essential ?? false;
      }
      return false;
    })
    .sort(
      (a, b) =>
        (getPyramidStep(a.category)?.order ?? 0) -
        (getPyramidStep(b.category)?.order ?? 0)
    );

  if (gaps.length === 0) {
    return (
      <div className="rounded-xl bg-success-light p-4 text-center text-success">
        אין פערים פתוחים — כל הכבוד! 🎉
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="font-bold text-text-main">פערים שנשארו</h2>
        <Badge variant="warning" size="sm">
          {gaps.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {gaps.map((item) => {
          const step = getPyramidStep(item.category);
          const label = CATEGORY_LABELS[item.category] ?? item.category;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-white p-3"
            >
              <span className="text-lg">{step?.emoji}</span>
              <span className="flex-1 truncate font-semibold text-text-main">
                {label}
              </span>
              <StatusBadge status={item.status} />
              <Link
                href={`/plan/${item.category}`}
                className="text-sm font-semibold text-primary"
              >
                להשלים
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
