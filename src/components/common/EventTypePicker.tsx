"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVENT_TYPES } from "@/lib/event-types";

interface EventTypePickerProps {
  value: string[];
  onChange: (ids: string[]) => void;
  /** Single-select (customer onboarding) vs multi-select (supplier profile). */
  multiple?: boolean;
  label?: string;
  hint?: string;
  className?: string;
}

export default function EventTypePicker({
  value,
  onChange,
  multiple = true,
  label = "סוגי אירועים",
  hint,
  className,
}: EventTypePickerProps) {
  const toggle = (id: string) => {
    if (multiple) {
      onChange(
        value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
      );
      return;
    }
    onChange([id]);
  };

  return (
    <div className={className}>
      <label className="text-sm font-semibold text-text-main block mb-2">
        {label}
      </label>
      {hint && (
        <p className="text-xs text-text-muted mb-2">{hint}</p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {EVENT_TYPES.map(({ id, label: eventLabel, emoji }) => {
          const selected = value.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={cn(
                "flex items-center gap-2 p-3 rounded-xl border-2 text-right text-sm font-semibold transition-all",
                selected
                  ? "border-primary bg-primary text-white"
                  : "border-border text-text-main hover:border-primary/40 bg-white"
              )}
            >
              <span className="text-lg shrink-0" aria-hidden>
                {emoji}
              </span>
              <span className="flex-1">{eventLabel}</span>
              {multiple && selected && (
                <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
