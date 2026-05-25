import useSWR from "swr";
import { MOCK_SUPPLIERS, type MockSupplier } from "@/lib/mock-data";

async function fetchSupplier(slug: string): Promise<MockSupplier | null> {
  await new Promise((r) => setTimeout(r, 300));
  return MOCK_SUPPLIERS.find((s) => s.slug === slug) || null;
}

export function useSupplier(slug: string | null) {
  const { data, error, isLoading } = useSWR<MockSupplier | null>(
    slug ? `supplier-${slug}` : null,
    () => fetchSupplier(slug!),
    { revalidateOnFocus: false }
  );

  return {
    supplier: data,
    isLoading,
    error,
    notFound: !isLoading && !error && data === null,
  };
}
