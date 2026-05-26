"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight, ChevronLeft, RefreshCw, Calendar, CheckCircle } from "lucide-react";
import SupplierDashboardLayout from "@/components/common/SupplierDashboardLayout";
import Button from "@/components/ui/Button";
import { HEBREW_DAYS, HEBREW_MONTHS, getDaysInMonth, getFirstDayOfMonth } from "@/lib/utils";
import { cn } from "@/lib/utils";

type DayStatus = "available" | "blocked" | "confirmed" | "pending";

function generateMockCalendar(year: number, month: number): Record<number, DayStatus> {
  const days: Record<number, DayStatus> = {};
  const daysCount = getDaysInMonth(year, month);
  for (let d = 1; d <= daysCount; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow === 6) {
      days[d] = "blocked"; // Saturdays blocked
    } else if (d === 15) {
      days[d] = "confirmed";
    } else if (d === 20) {
      days[d] = "pending";
    } else if (d === 8 || d === 12) {
      days[d] = "blocked";
    }
  }
  return days;
}

export default function SupplierCalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [calendarData, setCalendarData] = useState<Record<number, DayStatus>>(
    generateMockCalendar(today.getFullYear(), today.getMonth())
  );
  const searchParams = useSearchParams();
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      setCalendarConnected(true);
    }
  }, [searchParams]);

  const handleGoogleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch("/api/supplier/calendar/connect");
      const json = await res.json();
      if (json.success && json.data?.authUrl) {
        window.location.href = json.data.authUrl;
      }
    } finally {
      setIsConnecting(false);
    }
  };
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const prevMonth = () => {
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    setCalendarData(generateMockCalendar(newYear, newMonth));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    setCalendarData(generateMockCalendar(newYear, newMonth));
    setSelectedDay(null);
  };

  const handleDayClick = (day: number) => {
    setSelectedDay((prev) => (prev === day ? null : day));
  };

  const toggleBlock = (day: number) => {
    const current = calendarData[day];
    if (current === "blocked") {
      setCalendarData((prev) => {
        const next = { ...prev };
        delete next[day];
        return next;
      });
    } else if (!current) {
      setCalendarData((prev) => ({ ...prev, [day]: "blocked" }));
    }
    setSelectedDay(null);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const STATUS_STYLES: Record<DayStatus, string> = {
    available: "bg-white hover:bg-primary-light text-text-main",
    blocked: "bg-red-100 text-red-400 cursor-default",
    confirmed: "bg-primary text-white shadow-md",
    pending: "bg-amber-400 text-white",
  };

  const STATUS_LEGEND = [
    { color: "bg-white border border-border", label: "פנוי" },
    { color: "bg-red-100", label: "חסום" },
    { color: "bg-primary", label: "פגישה מאושרת" },
    { color: "bg-amber-400", label: "פגישה ממתינה" },
  ];

  return (
    <SupplierDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-text-main">לוח זמנים</h1>
          <p className="text-text-muted text-sm mt-1">
            נהלו את הזמינות שלכם
          </p>
        </div>

        {/* Google Calendar connection */}
        {!calendarConnected ? (
          <div className="bg-white rounded-2xl border border-border p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-text-main">חברי Google Calendar</h3>
              <p className="text-text-muted text-sm mt-0.5">
                סנכרון אוטומטי של הזמינות שלכם — כשיש לכם אירוע, פנוי תסמן אותו אוטומטית
              </p>
            </div>
            <Button onClick={handleGoogleConnect} isLoading={isConnecting}>
              חברי עכשיו
            </Button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-green-700 text-sm">
              מחובר לגוגל קלנדר ✓ — עדכון אחרון לפני 5 דקות
            </span>
            <button className="ms-auto flex items-center gap-1.5 text-green-600 hover:text-green-800 text-sm font-semibold">
              <RefreshCw className="h-3.5 w-3.5" />
              סנכרן עכשיו
            </button>
          </div>
        )}

        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <button
              onClick={prevMonth}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-text-muted" />
            </button>
            <h2 className="font-bold text-text-main text-lg">
              {HEBREW_MONTHS[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-text-muted" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-2 pt-3 pb-1">
            {HEBREW_DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-bold text-text-muted py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1 p-2">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;

              const status = calendarData[day] as DayStatus | undefined;
              const isToday =
                year === today.getFullYear() &&
                month === today.getMonth() &&
                day === today.getDate();
              const isSelected = selectedDay === day;
              const isClickable = !status || status === "blocked" || status === "available";

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => isClickable && handleDayClick(day)}
                  className={cn(
                    "relative aspect-square flex items-center justify-center text-sm font-semibold rounded-xl transition-all duration-150",
                    status ? STATUS_STYLES[status] : STATUS_STYLES.available,
                    isToday && !status && "ring-2 ring-primary",
                    isSelected && "ring-2 ring-primary ring-offset-1",
                    !isClickable && "cursor-default"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Selected day actions */}
          {selectedDay !== null && (
            <div className="border-t border-border px-6 py-4 flex items-center gap-3">
              <span className="text-sm font-semibold text-text-main">
                {selectedDay} {HEBREW_MONTHS[month]}
              </span>
              {calendarData[selectedDay] === "blocked" ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleBlock(selectedDay)}
                >
                  בטלי חסימה
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => toggleBlock(selectedDay)}
                >
                  חסמי יום
                </Button>
              )}
              <button
                onClick={() => setSelectedDay(null)}
                className="ms-auto text-sm text-text-muted hover:text-text-main"
              >
                ביטול
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="border-t border-border px-6 py-4 flex flex-wrap gap-4">
            {STATUS_LEGEND.map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-text-muted">
                <div className={`w-4 h-4 rounded ${color}`} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </SupplierDashboardLayout>
  );
}
