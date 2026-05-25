import useSWR from "swr";
import { getDaysInMonth } from "@/lib/utils";

interface DayAvailability {
  date: string; // YYYY-MM-DD
  isBlocked: boolean;
  slots: string[]; // HH:mm
}

async function fetchAvailability(
  supplierId: string,
  year: number,
  month: number
): Promise<DayAvailability[]> {
  await new Promise((r) => setTimeout(r, 200));

  const daysInMonth = getDaysInMonth(year, month);
  const result: DayAvailability[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    // Block Saturdays for now as mock
    const isBlocked = dayOfWeek === 6 || Math.random() < 0.15;

    result.push({
      date: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      isBlocked,
      slots: isBlocked
        ? []
        : ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"],
    });
  }

  return result;
}

export function useAvailability(
  supplierId: string | null,
  year: number,
  month: number
) {
  const { data, error, isLoading } = useSWR(
    supplierId ? `availability-${supplierId}-${year}-${month}` : null,
    () => fetchAvailability(supplierId!, year, month),
    { revalidateOnFocus: false }
  );

  const availabilityMap = new Map<string, DayAvailability>();
  data?.forEach((d) => availabilityMap.set(d.date, d));

  return {
    availability: data || [],
    availabilityMap,
    isLoading,
    error,
  };
}
