"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, CalendarDays, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import DatePickerField from "@/components/ui/DatePickerField";
import EventTypePicker from "@/components/common/EventTypePicker";
import { setEventContext } from "@/lib/event-context";
import { cn } from "@/lib/utils";

const REGIONS = [
  { id: "מרכז", label: "מרכז", emoji: "🏙️" },
  { id: "תל אביב", label: "תל אביב", emoji: "🌆" },
  { id: "ירושלים", label: "ירושלים", emoji: "🕌" },
  { id: "הצפון", label: "צפון", emoji: "🌿" },
  { id: "הדרום", label: "דרום", emoji: "🌵" },
  { id: "השרון", label: "השרון", emoji: "🌊" },
];

export default function HeroSearch() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [eventType, setEventType] = useState("wedding");

  const toggleArea = (id: string) => {
    setAreas((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const submit = () => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (areas.length) params.set("areas", areas.join(","));
    if (eventType) params.set("eventType", eventType);
    setEventContext({ date, areas, eventType });
    router.push(`/search${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-border p-5 sm:p-6 max-w-md mx-auto w-full text-right">
      <div className="space-y-5">
        {/* Event type */}
        <EventTypePicker
          multiple={false}
          value={[eventType]}
          onChange={(ids) => setEventType(ids[0] ?? "wedding")}
          label="סוג האירוע"
        />

        {/* Event date */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-primary" />
            תאריך האירוע
          </label>
          <DatePickerField
            value={date}
            onChange={setDate}
            placeholder="בחרו תאריך האירוע"
            modalTitle="מתי האירוע?"
          />
        </div>

        {/* Area multi-select */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" />
            אזור האירוע
            <span className="text-text-muted font-normal text-xs">(ניתן לבחור מספר אזורים)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {REGIONS.map(({ id, label, emoji }) => {
              const selected = areas.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleArea(id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl border-2 text-sm font-semibold transition-all duration-150",
                    selected
                      ? "border-primary bg-primary text-white shadow-md"
                      : "border-border bg-white text-text-main hover:border-primary/50 hover:bg-primary-light/30"
                  )}
                >
                  {selected && (
                    <span className="absolute top-1.5 left-1.5 w-4 h-4 bg-white/30 rounded-full flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </span>
                  )}
                  <span className="text-lg">{emoji}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Button type="button" onClick={submit} fullWidth size="lg" className="mt-2">
          מצאו ספקים 🔍
        </Button>
      </div>
    </div>
  );
}
