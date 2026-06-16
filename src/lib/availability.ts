import { getCache, setCache, delCachePattern } from "@/lib/redis";
import prisma from "@/lib/prisma";
import { getSupplierBusySlots } from "@/lib/google-calendar";
import { jerusalemParts, utcDateKey } from "@/lib/timezone";
import { AvailabilityDay, TimeSlot } from "@/types";

// ─── Working hours config (Israeli standard) ──────────────────────────────────

const WORK_START_HOUR = 9; // 09:00
const WORK_END_HOUR = 19; // last slot starts at 18:00, ends at 19:00

function generateWorkingSlots(): string[] {
  const slots: string[] = [];
  for (let h = WORK_START_HOUR; h < WORK_END_HOUR; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }
  return slots;
}

const ALL_WORKING_SLOTS = generateWorkingSlots();

// "HH:mm" → decimal hour (e.g. "14:30" → 14.5; "23:59" → ~24)
function toDecimalHour(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h + (m || 0) / 60;
}

// Every working slot whose [hour, hour+1) overlaps the block [start, end).
// Handles full-day blocks (00:00–23:59), Google all-day, and 1-hour bookings.
function workingSlotsCoveredBy(startDec: number, endDec: number): string[] {
  return ALL_WORKING_SLOTS.filter((t) => {
    const s = parseInt(t, 10);
    return s < endDec && s + 1 > startDec;
  });
}

// ─── Cache key helper ─────────────────────────────────────────────────────────

function cacheKey(supplierId: string, year: number, month: number): string {
  return `availability:${supplierId}:${year}-${String(month).padStart(2, "0")}`;
}

// ─── Main export: monthly availability ───────────────────────────────────────

export async function getAvailabilityForMonth(
  supplierId: string,
  year: number,
  month: number // 1-based
): Promise<AvailabilityDay[]> {
  const key = cacheKey(supplierId, year, month);

  const cached = await getCache<AvailabilityDay[]>(key);
  if (cached) return cached;

  const result = await computeAvailabilityForMonth(supplierId, year, month);

  await setCache(key, result, 5 * 60); // 5 min TTL
  return result;
}

async function computeAvailabilityForMonth(
  supplierId: string,
  year: number,
  month: number
): Promise<AvailabilityDay[]> {
  // Build the full date range for the month in UTC (Vercel runs UTC; @db.Date
  // rows come back as UTC midnight, so anchor everything to UTC to avoid an
  // off-by-one day shift on non-UTC runtimes).
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0)); // day 0 = last day of month

  // Fetch DB blocked slots for the month
  const dbBlocked = await prisma.availabilitySlot.findMany({
    where: {
      supplierId,
      date: {
        gte: firstDay,
        lte: lastDay,
      },
      isBlocked: true,
    },
  });

  // Build a map: dateStr -> Set of blocked working-slot times. Expand each
  // blocked row across the working slots it covers, so a full-day block
  // (00:00–23:59) or a multi-hour block hides every overlapped slot.
  const blockedByDate: Record<string, Set<string>> = {};
  for (const slot of dbBlocked) {
    const dateStr = slot.date.toISOString().slice(0, 10); // UTC-midnight @db.Date → correct date
    if (!blockedByDate[dateStr]) blockedByDate[dateStr] = new Set();
    const covered = workingSlotsCoveredBy(
      toDecimalHour(slot.startTime),
      toDecimalHour(slot.endTime)
    );
    for (const t of covered) blockedByDate[dateStr].add(t);
  }

  // Optionally overlay Google Calendar busy slots (interpreted in Israel time)
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { googleRefreshToken: true },
  });

  if (supplier?.googleRefreshToken) {
    try {
      const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
      const endOfMonth = new Date(Date.UTC(year, month, 1));
      const busySlots = await getSupplierBusySlots(
        supplierId,
        startOfMonth,
        endOfMonth
      );

      for (const busy of busySlots) {
        // Convert the absolute busy instants to Israel wall-clock so the right
        // hour is blocked regardless of the server timezone.
        const sp = jerusalemParts(new Date(busy.start));
        const ep = jerusalemParts(new Date(busy.end));
        const dateStr = sp.date;
        const startDec = sp.hour + sp.minute / 60;
        // If the busy period crosses midnight, block to end of this day.
        const endDec = ep.date === sp.date ? ep.hour + ep.minute / 60 : 24;
        if (!blockedByDate[dateStr]) blockedByDate[dateStr] = new Set();
        for (const t of workingSlotsCoveredBy(startDec, endDec)) {
          blockedByDate[dateStr].add(t);
        }
      }
    } catch (err) {
      // Non-fatal: fall back to DB-only data
      console.warn("[Availability] Google Calendar sync failed:", err);
    }
  }

  // Build result
  const days: AvailabilityDay[] = [];
  const daysInMonth = lastDay.getUTCDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = utcDateKey(year, month, day);
    const blocked = blockedByDate[dateStr] ?? new Set();

    const slots: TimeSlot[] = ALL_WORKING_SLOTS.map((time) => ({
      time,
      available: !blocked.has(time),
    }));

    days.push({ date: dateStr, slots });
  }

  return days;
}

// ─── Cache invalidation ───────────────────────────────────────────────────────

export async function invalidateAvailabilityCache(
  supplierId: string
): Promise<void> {
  await delCachePattern(`availability:${supplierId}:*`);
}
