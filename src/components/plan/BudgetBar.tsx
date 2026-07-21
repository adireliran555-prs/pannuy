"use client";

import { cn } from "@/lib/utils";
import { formatIls } from "@/lib/event-planning";

interface BudgetBarProps {
  total: number;
  committed: number;
  overBudget: boolean;
  projectedTotal?: number;
  className?: string;
}

/** Horizontal budget meter: committed spend vs total, with an optional
 *  projected-total marker (committed + allocations for remaining items). */
export default function BudgetBar({
  total,
  committed,
  overBudget,
  projectedTotal,
  className,
}: BudgetBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((committed / total) * 100)) : 0;
  const projPct =
    total > 0 && projectedTotal !== undefined
      ? Math.min(100, Math.round((projectedTotal / total) * 100))
      : null;
  const remaining = total - committed;

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-text-muted">שובץ עד כה</span>
        <span
          dir="ltr"
          className={cn("font-bold", overBudget ? "text-red-600" : "text-text-main")}
        >
          {formatIls(committed)} / {formatIls(total)}
        </span>
      </div>

      <div className="relative h-3 rounded-full bg-border overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            overBudget ? "bg-red-500" : "bg-primary"
          )}
          style={{ width: `${pct}%` }}
        />
        {projPct !== null && projPct > pct && (
          <div
            className="absolute top-0 h-full w-0.5 bg-text-main/50"
            style={{ right: `${projPct}%` }}
            title="תחזית לפי ההקצאות"
          />
        )}
      </div>

      <p
        className={cn(
          "text-sm mt-2 font-medium",
          overBudget ? "text-red-600" : "text-success"
        )}
      >
        {overBudget ? (
          <>חריגה מהתקציב: <span dir="ltr">{formatIls(Math.abs(remaining))}</span></>
        ) : (
          <>נותרו לשיבוץ: <span dir="ltr">{formatIls(remaining)}</span></>
        )}
      </p>
    </div>
  );
}
