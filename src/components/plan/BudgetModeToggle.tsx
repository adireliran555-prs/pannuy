"use client";

import type { BudgetMode } from "@prisma/client";
import { cn } from "@/lib/utils";

interface BudgetModeToggleProps {
  value: BudgetMode;
  onChange: (mode: BudgetMode) => void;
}

const OPTIONS: { mode: BudgetMode; label: string }[] = [
  { mode: "TOTAL", label: "תקציב כולל" },
  { mode: "PER_GUEST", label: "לפי אורח" },
];

/** Segmented control for choosing how the budget is entered. */
export default function BudgetModeToggle({
  value,
  onChange,
}: BudgetModeToggleProps) {
  return (
    <div className="flex rounded-xl border border-border bg-white p-1">
      {OPTIONS.map((opt) => {
        const active = value === opt.mode;
        return (
          <button
            key={opt.mode}
            type="button"
            onClick={() => onChange(opt.mode)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-semibold transition-colors duration-200",
              active ? "bg-primary text-white" : "text-text-muted"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
