"use client";

import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import CalendarPicker from "@/components/common/CalendarPicker";
import Modal from "@/components/ui/Modal";
import { cn, formatIsoDateHebrew, formatIsoDateShort, parseIsoDate, toIsoDate } from "@/lib/utils";

interface DatePickerFieldProps {
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  modalTitle?: string;
  error?: string;
  minDate?: Date;
  className?: string;
  triggerClassName?: string;
  variant?: "field" | "chip";
  clearable?: boolean;
}

export default function DatePickerField({
  value,
  onChange,
  placeholder = "בחרו תאריך",
  modalTitle = "בחרו תאריך",
  error,
  minDate = new Date(),
  className,
  triggerClassName,
  variant = "field",
  clearable = false,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (date: Date) => {
    onChange(toIsoDate(date));
    setOpen(false);
  };

  const displayLabel = value
    ? variant === "chip"
      ? formatIsoDateShort(value)
      : formatIsoDateHebrew(value)
    : placeholder;

  const selectedDate = value ? parseIsoDate(value) : null;

  if (variant === "chip") {
    return (
      <div className={className}>
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-full border-2 text-sm font-semibold transition-colors whitespace-nowrap overflow-hidden",
            value
              ? "border-primary bg-primary text-white"
              : "border-border bg-white text-text-main hover:border-primary",
            triggerClassName
          )}
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 cursor-pointer"
          >
            {value ? `📅 ${displayLabel}` : `📅 ${placeholder}`}
          </button>
          {clearable && value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="px-2 py-2.5 hover:bg-white/20 transition-colors"
              aria-label="נקו תאריך"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Modal open={open} onClose={() => setOpen(false)} title={modalTitle} size="sm">
          <div className="bg-surface rounded-2xl p-4 -mx-2">
            <CalendarPicker
              key={value || "new"}
              selectedDate={selectedDate}
              onDaySelect={handleSelect}
              minDate={minDate}
            />
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full min-w-0 rounded-xl border-2 border-border bg-white text-sm font-semibold text-text-main hover:border-primary transition-colors",
          "flex items-center gap-2 px-4 py-3 cursor-pointer text-start",
          error && "border-red-400",
          triggerClassName
        )}
      >
        <CalendarDays className="h-4 w-4 text-primary shrink-0" aria-hidden />
        <span className="flex-1 truncate text-text-main">
          {displayLabel}
        </span>
      </button>

      {error && <p className="text-sm text-red-500 font-medium mt-1">{error}</p>}

      <Modal open={open} onClose={() => setOpen(false)} title={modalTitle} size="sm">
        <div className="bg-surface rounded-2xl p-4 -mx-2">
          <CalendarPicker
            key={value || "new"}
            selectedDate={selectedDate}
            onDaySelect={handleSelect}
            minDate={minDate}
          />
        </div>
      </Modal>
    </div>
  );
}
