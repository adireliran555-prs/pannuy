import useSWR from "swr";
import { normalizeSupplier } from "@/lib/supplier";

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
