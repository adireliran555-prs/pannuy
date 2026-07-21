import useSWR from "swr";
import type { EventPayloadDTO } from "@/types/event";
import type { PlanItemStatus } from "@prisma/client";

async function fetcher(url: string): Promise<EventPayloadDTO | null> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch event");
  const json = await res.json();
  return (json.data ?? null) as EventPayloadDTO | null;
}

export interface UpdateItemInput {
  status?: PlanItemStatus;
  selectedSupplierId?: string;
  selectedPackageId?: string;
  notes?: string | null;
}

/**
 * Loads the current user's active plan (event + items + budget summary) and
 * exposes optimistic-friendly mutators. Returns `event: null` when the user has
 * not started a plan yet.
 */
export function useEvent() {
  const { data, error, isLoading, mutate } = useSWR<EventPayloadDTO | null>(
    "/api/events",
    fetcher,
    { revalidateOnFocus: false }
  );

  async function updateEvent(eventId: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (json?.success) await mutate(json.data, { revalidate: false });
    return json;
  }

  async function updateItem(eventId: string, itemId: string, input: UpdateItemInput) {
    const res = await fetch(`/api/events/${eventId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (json?.success) await mutate(json.data, { revalidate: false });
    return json;
  }

  return {
    payload: data ?? null,
    event: data?.event ?? null,
    items: data?.items ?? [],
    summary: data?.summary ?? null,
    isLoading,
    error,
    mutate,
    updateEvent,
    updateItem,
  };
}
