"use client";

import { Check } from "lucide-react";
import type { PickerPackageDTO } from "@/types/event";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

interface SelectablePackageProps {
  pkg: PickerPackageDTO;
  selected: boolean;
  overBudget?: boolean;
  onSelect: () => void;
}

const MAX_INCLUDES = 3;

/** Radio-style selectable package row inside PlanSupplierCard. */
export default function SelectablePackage({
  pkg,
  selected,
  overBudget = false,
  onSelect,
}: SelectablePackageProps) {
  const shown = pkg.includes.slice(0, MAX_INCLUDES);
  const extra = pkg.includes.length - shown.length;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "w-full rounded-xl border-2 p-3 text-start transition-colors duration-200",
        selected
          ? "border-primary bg-primary-light"
          : "border-border hover:border-primary/40"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Radio dot (right side in RTL) */}
        <span
          className={cn(
            "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2",
            selected ? "border-primary bg-primary" : "border-border bg-white"
          )}
        >
          {selected && <span className="h-2 w-2 rounded-full bg-white" />}
        </span>

        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Name + popular */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-text-main">{pkg.nameHe}</span>
            {pkg.isPopular && (
              <Badge variant="primary" size="sm">
                ✨ פופולרי
              </Badge>
            )}
          </div>

          {/* Price + hours */}
          <div className="flex items-baseline gap-2">
            <span
              dir="ltr"
              className={cn("font-black", overBudget ? "text-warning" : "text-primary")}
            >
              {formatPrice(pkg.price)}
            </span>
            {pkg.hours != null && (
              <span className="text-xs text-text-muted">
                {pkg.hours} שעות
              </span>
            )}
          </div>

          {/* Includes */}
          {shown.length > 0 && (
            <ul className="space-y-1">
              {shown.map((line, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-1.5 text-sm text-text-main"
                >
                  <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                  <span className="truncate">{line}</span>
                </li>
              ))}
              {extra > 0 && (
                <li className="text-xs text-text-muted">+{extra} נוספים</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </button>
  );
}
