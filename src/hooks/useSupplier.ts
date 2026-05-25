import useSWR from "swr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSupplier(s: any) {
  const profilePhoto =
    s.photos?.find((p: { type: string }) => p.type === "PROFILE")
      ?.cloudinaryUrl ??
    s.photos?.find((p: { type: string }) => p.type === "PORTFOLIO")
      ?.cloudinaryUrl ??
    `https://picsum.photos/seed/${s.slug}/400/300`;
  const coverPhoto =
    s.photos?.find((p: { type: string }) => p.type === "COVER")
      ?.cloudinaryUrl ?? profilePhoto;
  const portfolioPhotos =
    s.photos
      ?.filter((p: { type: string }) => p.type === "PORTFOLIO")
      .map((p: { cloudinaryUrl: string }) => p.cloudinaryUrl) ?? [];

  return {
    ...s,
    profilePhoto,
    coverPhoto,
    portfolio: portfolioPhotos,
    portfolioPhotos,
    bio: s.bioHe ?? s.bio ?? "",
    areas: s.serviceAreas ?? s.areas ?? [],
    rating: s.ratingAvg ?? s.rating ?? 0,
    priceFrom: s.basePriceFrom ?? s.priceFrom ?? 0,
    priceTo: s.basePriceTo ?? s.priceTo,
    responseRate: s.responseRate != null ? Math.round(s.responseRate * 100) : 95,
    responseTime: s.responseTime ?? 2,
    isAvailable: s.isAvailable ?? null,
    reviews: (s.reviews ?? []).map((r: { customer?: { name?: string }; textHe?: string; text?: string; createdAt?: string; date?: string; [key: string]: unknown }) => ({
      ...r,
      text: r.textHe ?? r.text ?? "",
      reviewerName: r.customer?.name ?? "אורח",
      date: r.date ?? r.createdAt ?? new Date().toISOString(),
    })),
  };
}

async function fetcher(url: string) {
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch supplier");
  const json = await res.json();
  return json.data ? normalizeSupplier(json.data) : null;
}

export function useSupplier(slug: string | null) {
  const { data, error, isLoading } = useSWR(
    slug ? `/api/suppliers/${slug}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    supplier: data ?? null,
    isLoading,
    error,
    notFound: !isLoading && !error && data === null,
  };
}
