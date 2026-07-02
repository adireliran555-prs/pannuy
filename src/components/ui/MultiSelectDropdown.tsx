"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  label?: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  error?: string;
  className?: string;
  variant?: "boxed" | "ghost";
}

export default function MultiSelectDropdown({
  label,
  values,
  onChange,
  options,
  placeholder = "בחרו",
  error,
  className,
  variant = "boxed",
}: MultiSelectDropdownProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const ghost = variant === "ghost";

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const toggle = (value: string) => {
    onChange(
      values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value]
    );
  };

  const summary =
    values.length === 0
      ? placeholder
      : options
          .filter((o) => values.includes(o.value))
          .map((o) => o.label)
          .join(" · ");

  return (
    <div ref={rootRef} className={cn(ghost ? "relative space-y-1" : "space-y-1.5", className)}>
      {label && (
        <label
          id={`${id}-label`}
          className={cn(
            "block",
            ghost
              ? "text-xs font-medium text-text-muted"
              : "text-sm font-semibold text-text-main"
          )}
        >
          {label}
        </label>
      )}
      <button
        type="button"
        aria-labelledby={`${id}-label`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 text-right",
          ghost
            ? "border-0 bg-transparent px-0 py-1.5 text-lg font-medium focus:outline-none"
            : cn(
                "h-12 rounded-xl border bg-white px-4 text-base",
                "border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
                error && "border-red-400"
              ),
          values.length === 0 ? "text-text-muted" : "text-text-main"
        )}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown
          className={cn(
            "flex-shrink-0 text-text-muted transition-transform",
            ghost ? "h-4 w-4" : "h-5 w-5",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "rounded-xl border border-border bg-white shadow-[var(--shadow-dropdown)] overflow-hidden z-50",
            ghost && "absolute inset-x-0 top-full mt-2"
          )}
        >
          {options.map((opt) => {
            const selected = values.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-3 text-sm text-right transition-colors",
                  "hover:bg-surface border-b border-border/60 last:border-b-0",
                  selected && "bg-primary-light/40"
                )}
              >
                <span className="font-medium text-text-main">{opt.label}</span>
                {selected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
    </div>
  );
}
