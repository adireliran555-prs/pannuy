"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Search, ArrowLeft } from "lucide-react";
import DatePickerField from "@/components/ui/DatePickerField";
import { setEventContext } from "@/lib/event-context";
import { cn } from "@/lib/utils";

const REGIONS = [
  { id: "מרכז", label: "מרכז" },
  { id: "תל אביב", label: "תל אביב" },
  { id: "ירושלים", label: "ירושלים" },
  { id: "הצפון", label: "צפון" },
  { id: "הדרום", label: "דרום" },
  { id: "השרון", label: "השרון" },
];

export default function HeroSearch() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [area, setArea] = useState("");

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

  const fieldClass =
    "w-full min-w-0 rounded-xl border-2 border-border bg-white text-sm font-semibold text-text-main hover:border-primary focus-within:border-primary focus:border-primary outline-none transition-colors";

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-border p-3 sm:p-4 max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-3">
        <DatePickerField
          value={date}
          onChange={setDate}
          placeholder="תאריך החתונה"
          modalTitle="מתי החתונה?"
        />

        {/* Area */}
        <div className="relative w-full min-w-0">
          <MapPin
            className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none"
            aria-hidden
          />
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className={cn(fieldClass, "appearance-none pe-10 ps-4 py-3 cursor-pointer")}
            aria-label="אזור"
          >
            <option value="">כל האזורים</option>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={submit}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-3.5 rounded-xl shadow-md hover:bg-primary-dark transition-colors text-sm"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span>חפשו ספקים פנויים</span>
          <ArrowLeft className="h-4 w-4 shrink-0" />
        </button>
      </div>
    </div>
  );
}
