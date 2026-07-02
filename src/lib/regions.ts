// Canonical region taxonomy shared by customer search/onboarding and supplier
// service-area selection so that filters actually match supplier data.
// (Suppliers serving "כל הארץ" are matched automatically server-side.)
export const REGIONS = [
  { id: "מרכז", label: "מרכז", emoji: "🏙️" },
  { id: "גוש דן", label: "גוש דן", emoji: "🌆" },
  { id: "תל אביב", label: "תל אביב", emoji: "🌃" },
  { id: "השרון", label: "השרון", emoji: "🌊" },
  { id: "ירושלים", label: "ירושלים", emoji: "🕌" },
  { id: "חיפה", label: "חיפה", emoji: "⚓" },
  { id: "הצפון", label: "צפון", emoji: "🌿" },
  { id: "הדרום", label: "דרום", emoji: "🌵" },
  { id: "שפלה", label: "שפלה", emoji: "🌾" },
  { id: "אילת", label: "אילת", emoji: "🏖️" },
] as const;

export const REGION_IDS = REGIONS.map((r) => r.id);
