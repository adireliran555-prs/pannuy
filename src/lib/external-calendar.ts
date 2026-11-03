// Read-only ICS subscription sync (iCloud "public calendar" / Outlook "publish
// calendar" links). One-way: calendar → AvailabilitySlot. Mirrors
// syncSupplierBusyDays in google-calendar.ts; the external event UID is stored
// in the existing `googleEventId` column so the (supplierId, date, uid) unique
// key keeps working.
import { AvailabilitySource, ExternalCalendarProvider } from "@prisma/client";
import prisma from "@/lib/prisma";
import { jerusalemParts, israelWallClockToInstant } from "@/lib/timezone";
import { invalidateAvailabilityCache } from "@/lib/availability";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_BYTES = 2 * 1024 * 1024;
const SYNC_MONTHS = 3;
const MAX_RECURRENCE_INSTANCES = 400;

export interface IcsEvent {
  uid: string;
  start: Date;
  end: Date;
  allDay: boolean;
}

// ─── URL validation ────────────────────────────────────────────────────────────

export function normalizeIcsUrl(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  if (/^webcal:\/\//i.test(s)) s = "https://" + s.slice("webcal://".length);
  if (/^webcals:\/\//i.test(s)) s = "https://" + s.slice("webcals://".length);
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
    host.includes(":") // IPv6 literal
  ) {
    return null;
  }
  return url.toString();
}

// ─── ICS parsing ───────────────────────────────────────────────────────────────

function unfold(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

interface Prop {
  name: string;
  params: Record<string, string>;
  value: string;
}

function parseProp(line: string): Prop | null {
  const idx = line.indexOf(":");
  if (idx < 0) return null;
  const head = line.slice(0, idx);
  const value = line.slice(idx + 1);
  const [name, ...paramParts] = head.split(";");
  const params: Record<string, string> = {};
  for (const p of paramParts) {
    const eq = p.indexOf("=");
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, "");
  }
  return { name: name.toUpperCase(), params, value };
}

// Returns { date: Date, allDay } — DATE values are all-day (date only); DATE-TIME
// values ending in Z are UTC; otherwise interpreted via TZID when it's an IANA
// zone, falling back to Israel wall-clock (floating / unknown zone).
function parseDateValue(prop: Prop): { date: Date; allDay: boolean } | null {
  const v = prop.value.trim();
  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(v);
  if (dateOnly || prop.params.VALUE === "DATE") {
    const m = dateOnly ?? /^(\d{4})(\d{2})(\d{2})/.exec(v);
    if (!m) return null;
    return { date: new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`), allDay: true };
  }
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z?)$/.exec(v);
  if (!m) return null;
  const [, y, mo, d, h, mi, s = "00", z] = m;
  if (z === "Z") {
    return { date: new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`), allDay: false };
  }
  const tzid = prop.params.TZID;
  if (tzid && tzid !== "Asia/Jerusalem" && tzid !== "Asia/Tel_Aviv") {
    const inst = wallClockInZone(`${y}-${mo}-${d}`, `${h}:${mi}`, tzid);
    if (inst) return { date: inst, allDay: false };
  }
  return { date: israelWallClockToInstant(`${y}-${mo}-${d}`, `${h}:${mi}`), allDay: false };
}

// Convert a wall-clock in an arbitrary IANA zone to an instant. Returns null for
// unknown zone ids (Outlook sometimes emits Windows names like "Israel Standard Time").
function wallClockInZone(dateStr: string, timeStr: string, tz: string): Date | null {
  let fmt: Intl.DateTimeFormat;
  try {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
  const naive = new Date(`${dateStr}T${timeStr}:00Z`);
  const parts = fmt.formatToParts(naive);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;
  const shown = new Date(
    `${get("year")}-${get("month")}-${get("day")}T${String(hour).padStart(2, "0")}:${get("minute")}:00Z`
  );
  return new Date(naive.getTime() - (shown.getTime() - naive.getTime()));
}

function parseDuration(v: string): number | null {
  const m = /^(-)?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(v.trim());
  if (!m) return null;
  const sign = m[1] ? -1 : 1;
  const [w, d, h, mi, s] = [m[2], m[3], m[4], m[5], m[6]].map((x) => parseInt(x ?? "0", 10));
  return sign * (((w * 7 + d) * 24 + h) * 3600 + mi * 60 + s) * 1000;
}

// Simple RRULE expansion: FREQ=DAILY|WEEKLY (with optional INTERVAL, COUNT,
// UNTIL, BYDAY for weekly). Anything else (MONTHLY/YEARLY/BYMONTHDAY/...) is
// skipped — those events are not synced. EXDATE honoured.
const BYDAY: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

function expandRRule(
  base: IcsEvent,
  rrule: string,
  exdates: Set<string>,
  windowStart: Date,
  windowEnd: Date
): IcsEvent[] {
  const rule: Record<string, string> = {};
  for (const part of rrule.split(";")) {
    const [k, v] = part.split("=");
    if (k && v) rule[k.toUpperCase()] = v.toUpperCase();
  }
  const freq = rule.FREQ;
  if (freq !== "DAILY" && freq !== "WEEKLY") return [];
  if (rule.BYMONTHDAY || rule.BYMONTH || rule.BYSETPOS || rule.BYHOUR) return [];
  const interval = Math.max(1, parseInt(rule.INTERVAL ?? "1", 10) || 1);
  const count = rule.COUNT ? parseInt(rule.COUNT, 10) : Infinity;
  let until: Date | null = null;
  if (rule.UNTIL) {
    const p = parseDateValue({ name: "UNTIL", params: {}, value: rule.UNTIL });
    until = p?.date ?? null;
  }
  const byDays = freq === "WEEKLY" && rule.BYDAY
    ? rule.BYDAY.split(",").map((d) => BYDAY[d.slice(-2)]).filter((n) => n !== undefined)
    : null;

  const durationMs = base.end.getTime() - base.start.getTime();
  const dayMs = 86_400_000;
  const out: IcsEvent[] = [];
  let produced = 0;
  let iterations = 0;
  const hardStop = new Date(Math.min(windowEnd.getTime(), until?.getTime() ?? Infinity));

  // Iterate day by day from the base start; cheap for a 3-month window.
  for (let t = base.start.getTime(); t <= hardStop.getTime() && produced < count; t += dayMs) {
    if (++iterations > MAX_RECURRENCE_INSTANCES * 7) break;
    const daysSince = Math.round((t - base.start.getTime()) / dayMs);
    let matches = false;
    if (freq === "DAILY") {
      matches = daysSince % interval === 0;
    } else {
      const weeksSince = Math.floor(daysSince / 7);
      if (weeksSince % interval !== 0) continue;
      const dow = new Date(t).getUTCDay();
      matches = byDays ? byDays.includes(dow) : daysSince % 7 === 0;
    }
    if (!matches) continue;
    produced++;
    const start = new Date(t);
    const key = base.allDay ? jerusalemParts(start).date : start.toISOString();
    if (exdates.has(key)) continue;
    const end = new Date(t + durationMs);
    if (end < windowStart) continue;
    out.push({ uid: `${base.uid}@${start.toISOString().slice(0, 10)}`, start, end, allDay: base.allDay });
    if (out.length >= MAX_RECURRENCE_INSTANCES) break;
  }
  return out;
}

export function parseIcs(text: string, windowStart: Date, windowEnd: Date): IcsEvent[] {
  const lines = unfold(text);
  const events: IcsEvent[] = [];
  let cur: Record<string, Prop> | null = null;
  let exdates: Set<string> = new Set();

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      cur = {};
      exdates = new Set();
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur) {
        const ev = buildEvent(cur);
        if (ev) {
          if (cur.RRULE) {
            events.push(...expandRRule(ev, cur.RRULE.value, exdates, windowStart, windowEnd));
          } else if (ev.end >= windowStart && ev.start <= windowEnd) {
            events.push(ev);
          }
        }
      }
      cur = null;
      continue;
    }
    if (!cur) continue;
    const prop = parseProp(line);
    if (!prop) continue;
    if (prop.name === "EXDATE") {
      for (const v of prop.value.split(",")) {
        const p = parseDateValue({ ...prop, value: v });
        if (p) exdates.add(p.allDay ? jerusalemParts(p.date).date : p.date.toISOString());
      }
      continue;
    }
    cur[prop.name] = prop;
  }
  return events;
}

function buildEvent(p: Record<string, Prop>): IcsEvent | null {
  if (p.STATUS?.value.toUpperCase() === "CANCELLED") return null;
  if (p.TRANSP?.value.toUpperCase() === "TRANSPARENT") return null; // "free" events don't block
  const uid = (p.UID?.value ?? "").trim();
  const start = p.DTSTART ? parseDateValue(p.DTSTART) : null;
  if (!uid || !start) return null;
  let end: Date;
  if (p.DTEND) {
    const e = parseDateValue(p.DTEND);
    if (!e) return null;
    end = e.date;
  } else if (p.DURATION) {
    const ms = parseDuration(p.DURATION.value);
    if (ms === null) return null;
    end = new Date(start.date.getTime() + ms);
  } else {
    end = start.allDay ? new Date(start.date.getTime() + 86_400_000) : new Date(start.date.getTime() + 3_600_000);
  }
  if (end <= start.date) end = new Date(start.date.getTime() + (start.allDay ? 86_400_000 : 60_000));
  // Recurrence overrides share the parent UID; disambiguate with RECURRENCE-ID.
  const rid = p["RECURRENCE-ID"]?.value;
  return { uid: rid ? `${uid}@rid-${rid}` : uid, start: start.date, end, allDay: start.allDay };
}

// ─── Fetch ─────────────────────────────────────────────────────────────────────

export async function fetchIcs(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { Accept: "text/calendar, text/plain;q=0.9, */*;q=0.5" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`ICS fetch failed: HTTP ${res.status}`);
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_BYTES) throw new Error("ICS too large");
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) throw new Error("ICS too large");
    const text = new TextDecoder("utf-8").decode(buf);
    if (!/BEGIN:VCALENDAR/i.test(text)) throw new Error("Not an ICS feed");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Sync ──────────────────────────────────────────────────────────────────────

function sourceFor(provider: ExternalCalendarProvider): AvailabilitySource {
  return provider === "ICLOUD" ? AvailabilitySource.ICLOUD : AvailabilitySource.OUTLOOK;
}

export const EXTERNAL_SOURCES: AvailabilitySource[] = [
  AvailabilitySource.ICLOUD,
  AvailabilitySource.OUTLOOK,
];

export async function syncExternalCalendar(supplierId: string): Promise<{ synced: number }> {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { externalCalendarUrl: true, externalCalendarProvider: true },
  });
  if (!supplier?.externalCalendarUrl || !supplier.externalCalendarProvider) {
    throw new Error("No external calendar configured");
  }
  const url = normalizeIcsUrl(supplier.externalCalendarUrl);
  if (!url) throw new Error("Invalid calendar URL");

  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setMonth(windowEnd.getMonth() + SYNC_MONTHS);

  const text = await fetchIcs(url);
  const events = parseIcs(text, now, windowEnd);
  const source = sourceFor(supplier.externalCalendarProvider);

  const seen = new Set<string>();
  let upserted = 0;

  for (const ev of events) {
    if (ev.allDay) {
      // One row per covered date (DTEND is exclusive for all-day events).
      for (let t = ev.start.getTime(); t < ev.end.getTime(); t += 86_400_000) {
        const date = new Date(t).toISOString().slice(0, 10);
        if (new Date(date) < new Date(jerusalemParts(now).date) || new Date(date) > windowEnd) continue;
        const uid = ev.uid;
        seen.add(uid);
        await prisma.availabilitySlot.upsert({
          where: { supplierId_date_googleEventId: { supplierId, date: new Date(date), googleEventId: uid } },
          create: {
            supplierId,
            date: new Date(date),
            startTime: "00:00",
            endTime: "23:59",
            isBlocked: true,
            source,
            googleEventId: uid,
          },
          update: { startTime: "00:00", endTime: "23:59", source, syncedAt: new Date() },
        });
        upserted++;
      }
      continue;
    }

    const s = jerusalemParts(ev.start);
    const e = jerusalemParts(ev.end);
    // Timed event crossing midnight: block to end of the start day.
    const endTime = e.date === s.date ? e.time : "23:59";
    seen.add(ev.uid);
    await prisma.availabilitySlot.upsert({
      where: { supplierId_date_googleEventId: { supplierId, date: new Date(s.date), googleEventId: ev.uid } },
      create: {
        supplierId,
        date: new Date(s.date),
        startTime: s.time,
        endTime,
        isBlocked: true,
        source,
        googleEventId: ev.uid,
      },
      update: { startTime: s.time, endTime, source, syncedAt: new Date() },
    });
    upserted++;
  }

  // Drop slots from this source whose event vanished from the feed.
  await prisma.availabilitySlot.deleteMany({
    where: {
      supplierId,
      source: { in: EXTERNAL_SOURCES },
      date: { gte: new Date(jerusalemParts(now).date), lte: new Date(jerusalemParts(windowEnd).date) },
      OR: [{ googleEventId: null }, { googleEventId: { notIn: Array.from(seen) } }],
    },
  });

  await prisma.supplier.update({
    where: { id: supplierId },
    data: { externalCalendarSyncedAt: new Date() },
  });
  await invalidateAvailabilityCache(supplierId);

  return { synced: upserted };
}

export async function clearExternalCalendar(supplierId: string): Promise<void> {
  await prisma.$transaction([
    prisma.availabilitySlot.deleteMany({ where: { supplierId, source: { in: EXTERNAL_SOURCES } } }),
    prisma.supplier.update({
      where: { id: supplierId },
      data: { externalCalendarUrl: null, externalCalendarProvider: null, externalCalendarSyncedAt: null },
    }),
  ]);
  await invalidateAvailabilityCache(supplierId);
}
