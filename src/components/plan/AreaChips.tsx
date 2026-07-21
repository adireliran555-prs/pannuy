"use client";

import { REGIONS } from "@/lib/regions";
import { cn } from "@/lib/utils";

interface AreaChipsProps {
  value: string[];
  onChange: (value: string[]) => void;
}

/** Multi-select pill chips for the event region(s). */
export default function AreaChips({ value, onChange }: AreaChipsProps) {
  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {REGIONS.map((region) => {
        const selected = value.includes(region.id);
        return (
          <button
            key={region.id}
            type="button"
            onClick={() => toggle(region.id)}
            className={cn(
              "rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors duration-200",
              selected
                ? "border-primary bg-primary text-white"
                : "border-border bg-white text-text-main hover:border-primary/40"
            )}
          >
            <span className="me-1">{region.emoji}</span>
            {region.label}
          </button>
        );
      })}
    </div>
  );
}
