import { getCache, setCache, delCachePattern } from "@/lib/redis";
import prisma from "@/lib/prisma";
import { getSupplierBusySlots } from "@/lib/google-calendar";
import { AvailabilityDay, TimeSlot } from "@/types";

// ─── Working hours config (Israeli standard) ──────────────────────────────────

const WORK_START_HOUR = 9; // 09:00
const WORK_END_HOUR = 19; // last slot starts at 18:00, ends at 19:00
const SLOT_DURATION_HOURS = 1;

function generateWorkingSlots(): string[] {
  const slots: string[] = [];
  for (let h = WORK_START_HOUR; h < WORK_END_HOUR; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }
  return slots;
}

const ALL_WORKING_SLOTS = generateWorkingSlots();

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
  // Build the full date range for the month
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0); // day 0 = last day of previous month

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

  // Build a map: dateStr -> Set of blocked start times
  const blockedByDate: Record<string, Set<string>> = {};
  for (const slot of dbBlocked) {
    const dateStr = slot.date.toISOString().slice(0, 10);
    if (!blockedByDate[dateStr]) blockedByDate[dateStr] = new Set();
    blockedByDate[dateStr].add(slot.startTime);
  }

  // Optionally overlay Google Calendar busy slots
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { googleRefreshToken: true },
  });

  if (supplier?.googleRefreshToken) {
    try {
      const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0);
      const endOfMonth = new Date(year, month, 1, 0, 0, 0);
      const busySlots = await getSupplierBusySlots(
        supplierId,
        startOfMonth,
        endOfMonth
      );

      for (const busy of busySlots) {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        // Mark all working slots that overlap with this busy period
        const dateStr = busyStart.toISOString().slice(0, 10);
        if (!blockedByDate[dateStr]) blockedByDate[dateStr] = new Set();

        for (const slotTime of ALL_WORKING_SLOTS) {
          const [slotHour] = slotTime.split(":").map(Number);
          const slotStart = new Date(`${dateStr}T${slotTime}:00`);
          const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_HOURS * 60 * 60 * 1000);
          // Overlap check: slot starts before busy ends AND slot ends after busy starts
          if (slotStart < busyEnd && slotEnd > busyStart) {
            blockedByDate[dateStr].add(slotTime);
          }
          void slotHour; // suppress unused warning
        }
      }
    } catch (err) {
      // Non-fatal: fall back to DB-only data
      console.warn("[Availability] Google Calendar sync failed:", err);
    }
  }

  // Build result
  const days: AvailabilityDay[] = [];
  const daysInMonth = lastDay.getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = date.toISOString().slice(0, 10);
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
