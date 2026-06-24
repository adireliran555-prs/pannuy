export interface EventContext {
  date: string;
  areas: string[];
  eventType?: string;
}

export const EVENT_CONTEXT_KEY = "pannuy_event_context";
export const EVENT_CONTEXT_CHANGED = "pannuy:event-context-changed";

export function getEventContext(): EventContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EVENT_CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EventContext;
    if (!parsed.date && (!parsed.areas || parsed.areas.length === 0)) return null;
    return {
      date: parsed.date ?? "",
      areas: Array.isArray(parsed.areas) ? parsed.areas : [],
      eventType: parsed.eventType,
    };
  } catch {
    return null;
  }
}

export function setEventContext(ctx: EventContext): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EVENT_CONTEXT_KEY, JSON.stringify(ctx));
  window.dispatchEvent(new CustomEvent(EVENT_CONTEXT_CHANGED, { detail: ctx }));
}

export function clearEventContext(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(EVENT_CONTEXT_KEY);
  window.dispatchEvent(new CustomEvent(EVENT_CONTEXT_CHANGED, { detail: null }));
}

export function syncEventContextFromUser(profile: {
  weddingDate?: string | null;
  weddingArea?: string | null;
}): EventContext | null {
  const date = profile.weddingDate?.split("T")[0] ?? "";
  const areas = profile.weddingArea
    ? profile.weddingArea.split(",").map((a) => a.trim()).filter(Boolean)
    : [];
  if (!date && areas.length === 0) return getEventContext();
  const ctx: EventContext = { date, areas };
  setEventContext(ctx);
  return ctx;
}
