"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { HEBREW_DAYS, HEBREW_MONTHS, getDaysInMonth, getFirstDayOfMonth } from "@/lib/utils";

interface CalendarPickerProps {
  selectedDate?: Date | null;
  onDaySelect: (date: Date) => void;
  blockedDates?: Set<string>; // YYYY-MM-DD
  minDate?: Date;
  className?: string;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default function CalendarPicker({
  selectedDate,
  onDaySelect,
  blockedDates = new Set(),
  minDate,
  className,
}: CalendarPickerProps) {
  const today = startOfDay(new Date());
  const initial = selectedDate ?? today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const minDay = minDate ? startOfDay(minDate) : null;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  // getFirstDayOfMonth returns 0=Sun, but Hebrew week starts Sunday, so offset is direct
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const formatDateKey = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isToday = (day: number) =>
    viewYear === today.getFullYear() &&
    viewMonth === today.getMonth() &&
    day === today.getDate();

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  };

  const isBlocked = (day: number) => {
    const key = formatDateKey(viewYear, viewMonth, day);
    if (blockedDates.has(key)) return true;
    if (minDay) {
      const date = new Date(viewYear, viewMonth, day);
      return date < minDay;
    }
    return false;
  };

  const canGoPrev =
    !minDay ||
    viewYear > minDay.getFullYear() ||
    (viewYear === minDay.getFullYear() && viewMonth > minDay.getMonth());

  // Build calendar grid
  const calendarDays: (number | null)[] = [];
  // Empty cells for days before first of month
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  return (
    <div className={cn("select-none", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          type="button"
          disabled={!canGoPrev}
          className="p-2 rounded-full hover:bg-primary-light transition-colors text-text-muted disabled:opacity-30 disabled:pointer-events-none"
          aria-label="חודש קודם"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <span className="font-black text-text-main text-base">
          {HEBREW_MONTHS[viewMonth]} {viewYear}
        </span>

        <button
          onClick={nextMonth}
          type="button"
          className="p-2 rounded-full hover:bg-primary-light transition-colors text-text-muted"
          aria-label="חודש הבא"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-2">
        {HEBREW_DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-bold text-text-muted py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;

          const blocked = isBlocked(day);
          const selected = isSelected(day);
          const todayDay = isToday(day);

          return (
            <button
              key={day}
              type="button"
              disabled={blocked}
              onClick={() => onDaySelect(new Date(viewYear, viewMonth, day))}
              className={cn(
                "relative w-full aspect-square flex items-center justify-center text-sm rounded-full transition-all duration-150",
                !blocked &&
                  !selected &&
                  "hover:bg-primary-light hover:text-primary-dark calendar-day-available",
                selected &&
                  "bg-primary text-white font-bold shadow-md calendar-day-selected",
                blocked &&
                  "text-gray-300 cursor-not-allowed calendar-day-blocked",
                todayDay && !selected && "calendar-day-today font-semibold",
                !blocked && !selected && todayDay && "ring-2 ring-primary"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
