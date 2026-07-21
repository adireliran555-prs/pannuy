"use client";

import { Calendar } from "lucide-react";
import { parseIsoDate } from "@/lib/utils";

interface CountdownProps {
  date: string | null;
  dateFlexible: boolean;
}

/** Whole days from today (local midnight) to the event date. */
function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseIsoDate(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** Inline pill showing time-to-event, or a "flexible date" note. */
export default function Countdown({ date, dateFlexible }: CountdownProps) {
  let text: string;

  if (dateFlexible || date === null) {
    text = "התאריך עדיין גמיש";
  } else {
    const days = daysUntil(date);
    if (days < 0) return null; // past event — render nothing
    if (days === 0) text = "האירוע היום! 🎉";
    else if (days === 1) text = "עוד יום לאירוע";
    else text = `עוד ${days} ימים לאירוע`;
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-sm font-semibold text-primary-dark">
      <Calendar className="h-3.5 w-3.5" />
      {text}
    </span>
  );
}
