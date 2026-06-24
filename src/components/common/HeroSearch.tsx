"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calendar, MapPin, Search, ArrowLeft } from "lucide-react";

const REGIONS = [
  { id: "מרכז", label: "מרכז" },
  { id: "תל אביב", label: "תל אביב" },
  { id: "ירושלים", label: "ירושלים" },
  { id: "הצפון", label: "צפון" },
  { id: "הדרום", label: "דרום" },
  { id: "השרון", label: "השרון" },
];

import { setEventContext } from "@/lib/event-context";

export default function HeroSearch() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [area, setArea] = useState("");
  const today = new Date().toISOString().split("T")[0];

  const submit = () => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (area) params.set("areas", area);
    if (date || area) {
      setEventContext({
        date,
        areas: area ? [area] : [],
      });
    }
    router.push(`/search${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-border p-3 sm:p-4 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row items-stretch gap-2">
        {/* Date — native input so iOS opens the system picker on tap */}
        <label className="relative flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-border text-text-main hover:border-primary focus-within:border-primary transition-colors text-sm font-semibold cursor-pointer">
          <Calendar className="h-4 w-4 text-primary flex-shrink-0" aria-hidden />
          <span className="text-text-muted">תאריך החתונה</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={today}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="תאריך החתונה"
          />
          {date && (
            <span className="ms-auto text-text-main">
              {new Date(date).toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </label>

        {/* Area */}
        <div className="relative flex-1">
          <MapPin className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" aria-hidden />
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full appearance-none pe-9 ps-4 py-3 rounded-xl border-2 border-border text-text-main hover:border-primary focus:border-primary outline-none transition-colors text-sm font-semibold bg-white cursor-pointer"
            aria-label="אזור"
          >
            <option value="">כל האזורים</option>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={submit}
          className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl shadow-md hover:bg-primary-dark transition-colors text-sm"
        >
          <Search className="h-4 w-4" />
          חפשו ספקים פנויים
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
