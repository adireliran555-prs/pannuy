import useSWR from "swr";
import { MOCK_SUPPLIERS, type MockSupplier } from "@/lib/mock-data";

interface SuppliersFilters {
  city?: string;
  date?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  page?: number;
}

interface SuppliersResponse {
  suppliers: MockSupplier[];
  total: number;
  page: number;
  totalPages: number;
}

// Fetcher that uses mock data in dev
async function fetchSuppliers(
  _key: string,
  filters: SuppliersFilters
): Promise<SuppliersResponse> {
  // In production this would be: fetch(`/api/suppliers?${params}`)
  await new Promise((r) => setTimeout(r, 400)); // simulate network

  let results = [...MOCK_SUPPLIERS];

  if (filters.city) {
    results = results.filter(
      (s) =>
        s.city.includes(filters.city!) ||
        s.areas.some((a) => a.includes(filters.city!))
    );
  }

  if (filters.ratingMin) {
    results = results.filter((s) => s.rating >= filters.ratingMin!);
  }

  if (filters.priceMin) {
    results = results.filter((s) => s.priceFrom >= filters.priceMin!);
  }

  if (filters.priceMax) {
    results = results.filter((s) => s.priceFrom <= filters.priceMax!);
  }

  const page = filters.page || 1;
  const perPage = 12;
  const total = results.length;
  const totalPages = Math.ceil(total / perPage);
  const paginated = results.slice((page - 1) * perPage, page * perPage);

  return { suppliers: paginated, total, page, totalPages };
}

export function useSuppliers(filters: SuppliersFilters = {}) {
  const key = ["suppliers", JSON.stringify(filters)];

  const { data, error, isLoading, mutate } = useSWR<SuppliersResponse>(
    key,
    ([, filtersStr]) => fetchSuppliers("", JSON.parse(filtersStr as string)),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  return {
    suppliers: data?.suppliers || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 1,
    isLoading,
    error,
    mutate,
  };
}
