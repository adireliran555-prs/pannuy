import useSWR from "swr";

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  const json = await res.json();
  return json.data ?? [];
}

export function useSaved() {
  const { data, error, isLoading, mutate } = useSWR("/api/saved", fetcher, {
    revalidateOnFocus: false,
  });

  async function toggle(supplierId: string, isSaved: boolean) {
    if (isSaved) {
      await fetch(`/api/saved/${supplierId}`, { method: "DELETE" });
    } else {
      await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId }),
      });
    }
    mutate();
  }

  return {
    saved: data ?? [],
    isLoading,
    error,
    mutate,
    toggle,
  };
}
