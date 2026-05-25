import useSWR from "swr";
import { MEETING_MOCK } from "@/lib/mock-data";

export function useMeetings() {
  const { data, error, isLoading, mutate } = useSWR(
    "meetings",
    async () => {
      await new Promise((r) => setTimeout(r, 300));
      return MEETING_MOCK;
    },
    { revalidateOnFocus: false }
  );

  return {
    meetings: data || [],
    upcoming: data?.filter((m) => m.status !== "completed") || [],
    past: data?.filter((m) => m.status === "completed") || [],
    cancelled: data?.filter((m) => m.status === "cancelled") || [],
    isLoading,
    error,
    mutate,
  };
}
