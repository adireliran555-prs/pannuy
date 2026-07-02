import useSWR from "swr";

export interface NormalizedSupplier {
  id: string;
  slug: string;
  name: string;
  city: string;
  profilePhoto: string;
  coverPhoto?: string;
  rating: number;
  ratingCount: number;
  priceFrom: number;
  priceTo?: number;
  category: string;
  isAvailable?: boolean;
  isSaved?: boolean;
}

interface SuppliersFilters {
  areas?: string[];
  date?: string;
  category?: string;
  eventType?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: "relevance" | "priceAsc" | "priceDesc";
  page?: number;
  limit?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSupplier(s: any): NormalizedSupplier {
  const profilePhoto =
    s.photos?.find((p: { type: string }) => p.type === "PROFILE")
      ?.cloudinaryUrl ??
    s.photos?.find((p: { type: string }) => p.type === "PORTFOLIO")
      ?.cloudinaryUrl ??
    "/placeholder-supplier.svg";
  const coverPhoto =
    s.photos?.find((p: { type: string }) => p.type === "COVER")
      ?.cloudinaryUrl ?? profilePhoto;
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    city: s.city ?? "",
    profilePhoto,
    coverPhoto,
    rating: s.ratingAvg ?? s.rating ?? 0,
    ratingCount: s.ratingCount ?? 0,
    priceFrom: s.basePriceFrom ?? s.priceFrom ?? 0,
    priceTo: s.basePriceTo ?? s.priceTo,
    category: s.category ?? "PHOTOGRAPHER",
    isAvailable: s.isAvailable,
    isSaved: s.isSaved ?? false,
  };
}

function buildUrl(filters: SuppliersFilters): string {
  const params = new URLSearchParams();
  if (filters.areas && filters.areas.length > 0) params.set("areas", filters.areas.join(","));
  if (filters.date) params.set("date", filters.date);
  if (filters.category) params.set("category", filters.category);
  if (filters.eventType) params.set("eventType", filters.eventType);
  if (filters.priceMin) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax) params.set("priceMax", String(filters.priceMax));
  if (filters.sortBy && filters.sortBy !== "relevance") params.set("sortBy", filters.sortBy);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  return `/api/suppliers?${params.toString()}`;
}

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch suppliers");
  const json = await res.json();
  const raw = json.data;
  const pagination = raw.pagination ?? {};
  return {
    suppliers: (raw.suppliers ?? []).map(normalizeSupplier),
    total: pagination.total ?? raw.total ?? 0,
    page: pagination.page ?? raw.page ?? 1,
    totalPages: pagination.totalPages ?? raw.totalPages ?? 1,
    areaFallback: raw.areaFallback ?? false,
  };
}

interface SuppliersResult {
  suppliers: NormalizedSupplier[];
  total: number;
  page: number;
  totalPages: number;
  areaFallback: boolean;
}

export function useSuppliers(
  filters: SuppliersFilters = {},
  fallbackData?: SuppliersResult
) {
  const url = buildUrl(filters);
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    fallbackData,
    // When the server already provided initialData for this exact query, skip
    // the redundant on-mount refetch. Filter changes still fetch normally.
    revalidateOnMount: !fallbackData,
  });

  return {
    suppliers: data?.suppliers ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
    areaFallback: data?.areaFallback ?? false,
    isLoading,
    error,
    mutate,
  };
}
