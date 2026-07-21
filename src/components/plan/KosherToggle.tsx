"use client";

import { cn } from "@/lib/utils";

interface KosherToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

const OPTIONS: { value: boolean; label: string }[] = [
  { value: true, label: "כן, כשר" },
  { value: false, label: "לא נדרש" },
];

/** Yes/no segmented control for the kosher requirement. */
export default function KosherToggle({ value, onChange }: KosherToggleProps) {
  return (
    <div className="flex rounded-xl border border-border bg-white p-1">
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
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
