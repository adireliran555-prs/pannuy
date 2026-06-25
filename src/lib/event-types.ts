export const EVENT_TYPES = [
  { id: "wedding", label: "חתונה", emoji: "💍" },
  { id: "bar_mitzvah", label: "בר/בת מצווה", emoji: "✡️" },
  { id: "birthday", label: "יום הולדת", emoji: "🎂" },
  { id: "corporate", label: "אירוע עסקי", emoji: "💼" },
  { id: "other", label: "אחר", emoji: "🎉" },
] as const;

export type EventTypeId = (typeof EVENT_TYPES)[number]["id"];

const VALID_IDS = new Set<string>(EVENT_TYPES.map((e) => e.id));

export function isValidEventTypeId(id: string): id is EventTypeId {
  return VALID_IDS.has(id);
}

export function normalizeEventTypes(ids: string[] | undefined | null): EventTypeId[] {
  if (!ids?.length) return [];
  const seen = new Set<EventTypeId>();
  for (const id of ids) {
    if (isValidEventTypeId(id)) seen.add(id);
  }
  return EVENT_TYPES.map((e) => e.id).filter((id) => seen.has(id));
}

export function getEventTypeLabel(id: string): string {
  return EVENT_TYPES.find((e) => e.id === id)?.label ?? id;
}
