import useSWR from "swr";
import { MOCK_SUPPLIERS } from "@/lib/mock-data";

export function useSaved() {
  const { data, error, isLoading, mutate } = useSWR(
    "saved-suppliers",
    async () => {
      await new Promise((r) => setTimeout(r, 300));
      return MOCK_SUPPLIERS.filter((s) => s.isSaved);
    },
    { revalidateOnFocus: false }
  );

  return {
    saved: data || [],
    isLoading,
    error,
    mutate,
  };
}
