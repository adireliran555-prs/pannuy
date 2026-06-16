"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight, ChevronLeft, RefreshCw, Calendar, CheckCircle } from "lucide-react";
import SupplierDashboardLayout from "@/components/common/SupplierDashboardLayout";
import Button from "@/components/ui/Button";
import { HEBREW_DAYS, HEBREW_MONTHS, getDaysInMonth, getFirstDayOfMonth } from "@/lib/utils";
import { cn } from "@/lib/utils";

type DayStatus = "available" | "blocked" | "confirmed" | "pending";

interface BlockedDay {
  id: string;
  date: string;
}

function GoogleCalendarBanner({ onSynced }: { onSynced?: () => void }) {
  const searchParams = useSearchParams();
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    // Connected if we just returned from OAuth (?connected=true) OR the profile
    // already has a linked Google calendar.
    if (searchParams.get("connected") === "true") {
      setCalendarConnected(true);
      return;
    }
    fetch("/api/supplier/profile")
      .then((r) => r.json())
      .then((j) => {
        const supplier = j.data ?? j.supplier ?? j;
        if (supplier?.googleCalendarId) setCalendarConnected(true);
      })
      .catch(() => {});
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

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/supplier/calendar/sync", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        setSyncMsg(`סונכרן ✓ (${json.data?.synced ?? 0} אירועים)`);
        onSynced?.();
      } else {
        setSyncMsg(json.error ?? "הסנכרון נכשל");
      }
    } catch {
      setSyncMsg("הסנכרון נכשל, נסו שוב");
    } finally {
      setIsSyncing(false);
    }
  };

  if (calendarConnected) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center gap-3 flex-wrap">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="font-semibold text-green-700 text-sm">
          מחובר ל-Google Calendar ✓
        </span>
        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncing}
          className="ms-auto flex items-center gap-1.5 text-green-600 hover:text-green-800 disabled:opacity-50 text-sm font-semibold"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
          {isSyncing ? "מסנכרן..." : "סנכרן עכשיו"}
        </button>
        {syncMsg && (
          <span className="w-full text-xs text-green-700">{syncMsg}</span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Calendar className="h-6 w-6 text-blue-600" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-text-main">חברו את Google Calendar</h3>
        <p className="text-text-muted text-sm mt-0.5">
          סנכרון אוטומטי של הזמינות שלכם — כשיש לכם אירוע, פנוי תסמן אותו אוטומטית
        </p>
      </div>
      <Button onClick={handleGoogleConnect} isLoading={isConnecting}>
        חברו עכשיו
      </Button>
    </div>
  );
}

export default function SupplierCalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [calendarData, setCalendarData] = useState<Record<number, DayStatus>>({});
  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isTogglingBlock, setIsTogglingBlock] = useState(false);

  const loadData = useCallback(async (y: number, m: number) => {
    const [meetingsRes, blockedRes] = await Promise.all([
      fetch("/api/supplier/meetings"),
      fetch(`/api/supplier/availability/block?year=${y}&month=${m + 1}`),
    ]);

    const meetingsJson = await meetingsRes.json();
    const blockedJson = await blockedRes.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meetings: any[] = meetingsJson.data ?? [];
    const blocked: BlockedDay[] = blockedJson.data ?? [];

    setBlockedDays(blocked);

    const data: Record<number, DayStatus> = {};

    // Map blocked days
    for (const b of blocked) {
      const d = new Date(b.date);
      if (d.getFullYear() === y && d.getMonth() === m) {
        data[d.getDate()] = "blocked";
      }
    }

    // Map meetings (confirmed/pending override blocked)
    for (const meeting of meetings) {
      const d = new Date(meeting.requestedDate);
      if (d.getFullYear() === y && d.getMonth() === m) {
        if (meeting.status === "CONFIRMED") {
          data[d.getDate()] = "confirmed";
        } else if (meeting.status === "PENDING") {
          data[d.getDate()] = data[d.getDate()] === "confirmed" ? "confirmed" : "pending";
        }
      }
    }

    setCalendarData(data);
  }, []);

  useEffect(() => {
    loadData(year, month);
  }, [year, month, loadData]);

  const prevMonth = () => {
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDay(null);
  };

  const handleDayClick = (day: number) => {
    setSelectedDay((prev) => (prev === day ? null : day));
  };

  const toggleBlock = async (day: number) => {
    const current = calendarData[day];
    setIsTogglingBlock(true);

    try {
      if (current === "blocked") {
        const blockedDay = blockedDays.find((b) => {
          const d = new Date(b.date);
          return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
        });
        if (blockedDay) {
          await fetch(`/api/supplier/availability/${blockedDay.id}`, { method: "DELETE" });
        }
        setCalendarData((prev) => {
          const next = { ...prev };
          delete next[day];
          return next;
        });
        setBlockedDays((prev) => prev.filter((b) => b.id !== blockedDay?.id));
      } else if (!current) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const res = await fetch("/api/supplier/availability/block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: dateStr, startTime: "00:00", endTime: "23:59" }),
        });
        if (res.ok) {
          const json = await res.json();
          setCalendarData((prev) => ({ ...prev, [day]: "blocked" }));
          if (json.data?.id) {
            setBlockedDays((prev) => [...prev, { id: json.data.id, date: dateStr }]);
          }
        }
      }
    } finally {
      setIsTogglingBlock(false);
      setSelectedDay(null);
    }
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
        <Suspense fallback={null}>
          <GoogleCalendarBanner onSynced={() => loadData(year, month)} />
        </Suspense>

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
                    // Today: emphasized number + a dot marker (no ring), so it's
                    // distinct from the selected day's ring.
                    isToday && !status && "text-primary font-black",
                    // Selected: a clear ring + offset (the only ringed day).
                    isSelected && "ring-2 ring-primary ring-offset-2",
                    !isClickable && "cursor-default"
                  )}
                >
                  {day}
                  {isToday && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
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
                  isLoading={isTogglingBlock}
                  onClick={() => toggleBlock(selectedDay)}
                >
                  בטלו חסימה
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="danger"
                  isLoading={isTogglingBlock}
                  onClick={() => toggleBlock(selectedDay)}
                >
                  חסמו יום
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
