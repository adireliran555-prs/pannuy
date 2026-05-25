"use client";

import { useState } from "react";
import CalendarPicker from "./CalendarPicker";
import TimeSlotPicker from "./TimeSlotPicker";
import Spinner from "@/components/ui/Spinner";
import { useAvailability } from "@/hooks/useAvailability";
import { formatHebrewDate } from "@/lib/utils";

interface AvailabilityCalendarProps {
  supplierId: string;
  onSelectionChange?: (date: Date | null, slot: string | null) => void;
}

export default function AvailabilityCalendar({
  supplierId,
  onSelectionChange,
}: AvailabilityCalendarProps) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const { availability, availabilityMap, isLoading } = useAvailability(
    supplierId,
    viewYear,
    viewMonth
  );

  const blockedDates = new Set(
    availability.filter((d) => d.isBlocked).map((d) => d.date)
  );

  const handleDaySelect = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    // If navigating to different month
    if (year !== viewYear || month !== viewMonth) {
      setViewYear(year);
      setViewMonth(month);
    }
    setSelectedDate(date);
    setSelectedSlot(null);
    onSelectionChange?.(date, null);
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    onSelectionChange?.(selectedDate, slot);
  };

  const selectedKey = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : null;

  const availableSlots = selectedKey
    ? availabilityMap.get(selectedKey)?.slots || []
    : [];

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <CalendarPicker
          selectedDate={selectedDate}
          onDaySelect={handleDaySelect}
          blockedDates={blockedDates}
          minDate={today}
        />
      )}

      {selectedDate && (
        <div>
          <h4 className="font-semibold text-text-main mb-3 text-sm">
            שעות פנויות ב{formatHebrewDate(selectedDate)}
          </h4>
          <TimeSlotPicker
            slots={availableSlots}
            selectedSlot={selectedSlot}
            onSlotSelect={handleSlotSelect}
          />
        </div>
      )}
    </div>
  );
}
