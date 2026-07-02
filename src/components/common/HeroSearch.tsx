"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import DatePickerField from "@/components/ui/DatePickerField";
import FormSelect from "@/components/ui/FormSelect";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";
import { setEventContext } from "@/lib/event-context";
import { EVENT_TYPES } from "@/lib/event-types";
import { REGIONS } from "@/lib/regions";

export default function HeroSearch() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [eventType, setEventType] = useState("wedding");

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
        {/* Event type — dropdown */}
        <FormSelect
          label="סוג האירוע"
          value={eventType}
          onChange={setEventType}
          options={EVENT_TYPES.map((t) => ({ value: t.id, label: t.label }))}
          placeholder="בחרו סוג אירוע"
        />

        {/* Event date */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-text-main">תאריך האירוע</label>
          <DatePickerField
            value={date}
            onChange={setDate}
            placeholder="בחרו תאריך האירוע"
            modalTitle="מתי האירוע?"
          />
        </div>

        {/* Area — multi-select dropdown */}
        <MultiSelectDropdown
          label="אזור האירוע"
          values={areas}
          onChange={setAreas}
          options={REGIONS.map((r) => ({ value: r.id, label: r.label }))}
          placeholder="בחרו אזור אחד או יותר"
        />

        <Button type="button" onClick={submit} fullWidth size="lg" className="mt-2">
          מצאו ספקים 🔍
        </Button>
      </div>
    </div>
  );
}
