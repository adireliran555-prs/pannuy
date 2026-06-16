// Single source of truth for supplier category labels (Hebrew).
// Matches Nitzan's canonical list. Use CATEGORY_LABELS everywhere a category is
// shown to users; do not redefine category strings in components.

export const CATEGORY_LABELS: Record<string, string> = {
  PHOTOGRAPHER: "צלמי סטילס",
  VIDEOGRAPHER: "צלמי וידיאו",
  PHOTO_BOOTH: "צלמי מגנטים",
  DJ: "תקליטנים",
  CATERING: "קייטרינג ושפים",
  VENUE: "אולמות וגני אירועים",
  HAIR_STYLIST: "מסרקות",
  MAKEUP_ARTIST: "מאפרות",
  EVENT_PRODUCER: "הושבה ומפיקים",
  // Legacy categories — kept for existing records, not offered in pickers.
  BRIDAL_SUITE: "חדרי כלה",
  FLORIST: "עיצוב פרחוני",
};

// Singular form for a single supplier (cards, profile header).
export const CATEGORY_LABELS_SINGULAR: Record<string, string> = {
  PHOTOGRAPHER: "צלם סטילס",
  VIDEOGRAPHER: "צלם וידיאו",
  PHOTO_BOOTH: "צלם מגנטים",
  DJ: "תקליטן",
  CATERING: "קייטרינג ושפים",
  VENUE: "אולם/גן אירועים",
  HAIR_STYLIST: "מסרקת",
  MAKEUP_ARTIST: "מאפרת",
  EVENT_PRODUCER: "הושבה/מפיק",
  BRIDAL_SUITE: "חדרי כלה",
  FLORIST: "עיצוב פרחוני",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
