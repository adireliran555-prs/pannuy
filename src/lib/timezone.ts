// Israel-timezone helpers. The Vercel runtime is UTC, but all meeting/availability
// times are Israel wall-clock (Asia/Jerusalem, UTC+2/+3 with DST). Deriving hours
// or date keys via getHours()/toISOString() uses the SERVER tz and is wrong off
// the UTC offset. Use these to read an absolute instant as Israel wall-clock.

const JERUSALEM = "Asia/Jerusalem";

const partsFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: JERUSALEM,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export interface JerusalemParts {
  date: string; // YYYY-MM-DD (Israel calendar date)
  hour: number; // 0-23
  minute: number;
  time: string; // HH:mm
}

/** Read an absolute instant as Israel wall-clock date + time. */
export function jerusalemParts(instant: Date): JerusalemParts {
  const parts = partsFmt.formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0; // some engines emit 24 for midnight
  const minute = parseInt(get("minute"), 10);
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour,
    minute,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

/** Decimal Israel hour-of-day for an instant (e.g. 14.5 for 14:30). */
export function jerusalemHourDecimal(instant: Date): number {
  const { hour, minute } = jerusalemParts(instant);
  return hour + minute / 60;
}

/** Build a YYYY-MM-DD key from numeric Y/M/D without local-tz drift. */
export function utcDateKey(year: number, month1: number, day: number): string {
  return `${year}-${String(month1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Convert an Israel wall-clock date+time ("YYYY-MM-DD", "HH:mm") to the correct
 * absolute instant, accounting for the active UTC+2/+3 DST offset on that date.
 */
export function israelWallClockToInstant(dateStr: string, timeStr: string): Date {
  // Interpret the wall-clock as if it were UTC, then correct by Israel's offset.
  const naiveUtc = new Date(`${dateStr}T${timeStr}:00Z`);
  const p = jerusalemParts(naiveUtc); // what Israel clock shows at that UTC instant
  const ilAsUtc = new Date(`${p.date}T${p.time}:00Z`);
  const offsetMs = ilAsUtc.getTime() - naiveUtc.getTime(); // Israel offset on that date
  return new Date(naiveUtc.getTime() - offsetMs);
}
