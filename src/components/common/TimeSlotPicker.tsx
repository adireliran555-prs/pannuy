"use client";

import { cn } from "@/lib/utils";

interface TimeSlotPickerProps {
  slots: string[];
  selectedSlot?: string | null;
  onSlotSelect: (slot: string) => void;
  className?: string;
}

export default function TimeSlotPicker({
  slots,
  selectedSlot,
  onSlotSelect,
  className,
}: TimeSlotPickerProps) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-6 text-text-muted text-sm">
        אין שעות פנויות ביום זה
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-3 sm:grid-cols-4 gap-2", className)}>
      {slots.map((slot) => {
        const isSelected = slot === selectedSlot;
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onSlotSelect(slot)}
            className={cn(
              "py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
              isSelected
                ? "bg-primary text-white border-primary shadow-md scale-105"
                : "bg-white text-text-main border-border hover:border-primary/50 hover:bg-primary-light/30"
            )}
            dir="ltr"
          >
            {slot}
          </button>
        );
      })}
    </div>
  );
}
