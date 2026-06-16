import useSWR from "swr";

interface DayAvailability {
  date: string; // YYYY-MM-DD
  isBlocked: boolean;
  slots: string[]; // HH:mm — available times only
}

interface ApiTimeSlot {
  time: string;
  available: boolean;
}

interface ApiAvailabilityDay {
  date: string;
  slots: ApiTimeSlot[];
}

// Fetch real availability from the API. `month` is 0-based (JS convention);
// the endpoint expects 1-based, so we add 1.
async function fetchAvailability(
  supplierId: string,
  year: number,
  month: number
): Promise<DayAvailability[]> {
  const res = await fetch(
    `/api/suppliers/${supplierId}/availability?year=${year}&month=${month + 1}`
  );
  if (!res.ok) throw new Error("Failed to load availability");
  const json = await res.json();
  const days: ApiAvailabilityDay[] = json.data ?? [];

  return days.map((d) => {
    const available = d.slots.filter((s) => s.available).map((s) => s.time);
    return { date: d.date, isBlocked: available.length === 0, slots: available };
  });
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
