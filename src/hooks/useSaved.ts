import useSWR from "swr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSaved(item: any) {
  const s = item.supplier ?? item;
  const profilePhoto =
    s.photos?.find((p: { type: string }) => p.type === "PROFILE")?.cloudinaryUrl ??
    s.photos?.find((p: { type: string }) => p.type === "PORTFOLIO")?.cloudinaryUrl ??
    "/placeholder-supplier.svg";
  const coverPhoto =
    s.photos?.find((p: { type: string }) => p.type === "COVER")?.cloudinaryUrl ??
    profilePhoto;
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    city: s.city ?? "",
    category: s.category ?? "PHOTOGRAPHER",
    profilePhoto,
    coverPhoto,
    rating: s.ratingAvg ?? 0,
    ratingCount: s.ratingCount ?? 0,
    priceFrom: s.basePriceFrom ?? 0,
    priceTo: s.basePriceTo ?? undefined,
    isVerified: s.isVerified,
  };
}

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  const json = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (json.data ?? []).map(normalizeSaved);
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
