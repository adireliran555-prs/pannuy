"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, MapPin, Pencil, X, Check } from "lucide-react";
import {
  EVENT_CONTEXT_CHANGED,
  getEventContext,
  setEventContext,
  type EventContext,
} from "@/lib/event-context";
import CalendarPicker from "@/components/common/CalendarPicker";
import { cn, parseIsoDate, toIsoDate } from "@/lib/utils";

const REGIONS = [
  "מרכז",
  "תל אביב",
  "ירושלים",
  "הצפון",
  "הדרום",
  "השרון",
];

function formatEventDate(date: string): string {
  if (!date) return "לא נבחר תאריך";
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const HIDDEN_PREFIXES = ["/start", "/supplier", "/admin", "/for-suppliers"];

export default function EventContextBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [ctx, setCtx] = useState<EventContext | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftDate, setDraftDate] = useState("");
  const [draftAreas, setDraftAreas] = useState<string[]>([]);

  const refresh = useCallback(() => {
    setCtx(getEventContext());
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(EVENT_CONTEXT_CHANGED, onChange);
    return () => window.removeEventListener(EVENT_CONTEXT_CHANGED, onChange);
  }, [refresh]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.user) {
          const date = json.user.weddingDate?.split("T")[0] ?? "";
          const areas = json.user.weddingArea
            ? json.user.weddingArea.split(",").map((a: string) => a.trim()).filter(Boolean)
            : [];
          const stored = getEventContext();
          if (!stored && (date || areas.length > 0)) {
            setEventContext({ date, areas });
          }
        }
      })
      .catch(() => {});
  }, []);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  if (!ctx?.date && (!ctx?.areas || ctx.areas.length === 0)) return null;

  const openEdit = () => {
    setDraftDate(ctx?.date ?? "");
    setDraftAreas(ctx?.areas ?? []);
    setEditing(true);
  };

  const toggleArea = (area: string) => {
    setDraftAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const applyChanges = async () => {
    const next: EventContext = {
      date: draftDate,
      areas: draftAreas,
      eventType: ctx?.eventType,
    };
    setEventContext(next);
    setEditing(false);

    try {
      await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingDate: draftDate || undefined,
          weddingArea: draftAreas.length > 0 ? draftAreas.join(",") : undefined,
        }),
      });
    } catch {
      /* best-effort */
    }

    if (pathname.startsWith("/search")) {
      const params = new URLSearchParams();
      if (draftDate) params.set("date", draftDate);
      if (draftAreas.length > 0) params.set("areas", draftAreas.join(","));
      router.push(`/search?${params.toString()}`);
    } else {
      router.refresh();
    }
  };

  return (
    <>
      <div className="sticky top-0 z-30 bg-primary/5 border-b border-primary/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 flex-wrap text-sm">
          <span className="font-bold text-text-main text-xs uppercase tracking-wide text-primary">
            האירוע שלכם
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white border border-border rounded-full px-3 py-1">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            {formatEventDate(ctx.date)}
          </span>
          {ctx.areas.length > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-white border border-border rounded-full px-3 py-1">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {ctx.areas.join(" · ")}
            </span>
          )}
          <button
            type="button"
            onClick={openEdit}
            className="ms-auto inline-flex items-center gap-1 text-primary font-semibold text-xs hover:underline"
          >
            <Pencil className="h-3.5 w-3.5" />
            ערכו
          </button>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-text-main">פרטי האירוע</h2>
              <button type="button" onClick={() => setEditing(false)} aria-label="סגור">
                <X className="h-5 w-5 text-text-muted" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text-main">תאריך</label>
              <div className="bg-surface rounded-2xl p-3">
                <CalendarPicker
                  key={draftDate || "empty"}
                  selectedDate={draftDate ? parseIsoDate(draftDate) : null}
                  onDaySelect={(date) => setDraftDate(toIsoDate(date))}
                  minDate={new Date()}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-main">אזור</label>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleArea(area)}
                    className={cn(
                      "px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all",
                      draftAreas.includes(area)
                        ? "border-primary bg-primary text-white"
                        : "border-border text-text-main"
                    )}
                  >
                    {draftAreas.includes(area) && <Check className="h-3 w-3 inline me-1" />}
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={applyChanges}
              className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition-colors"
            >
              עדכנו והמשיכו
            </button>
          </div>
        </div>
      )}
    </>
  );
}
