import useSWR from "swr";

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  const json = await res.json();
  return json.data ?? [];
}

export function useMeetings(status?: string) {
  const url = status ? `/api/meetings?status=${status}` : "/api/meetings";
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
  });

  const meetings = data ?? [];

  return {
    meetings,
    upcoming: meetings.filter((m: { status: string }) =>
      ["PENDING", "CONFIRMED"].includes(m.status)
    ),
    past: meetings.filter((m: { status: string }) => m.status === "COMPLETED"),
    cancelled: meetings.filter((m: { status: string }) =>
      ["CANCELLED", "REJECTED"].includes(m.status)
    ),
    isLoading,
    error,
    mutate,
  };
}
