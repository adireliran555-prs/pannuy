export interface RecentView {
  slug: string;
  name: string;
}

export const RECENTLY_VIEWED_KEY = "pannuy_recently_viewed";
export const MAX_RECENTLY_VIEWED = 6;

export function readRecentlyViewed(): RecentView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => {
        if (typeof item === "string") {
          return { slug: item, name: item.replace(/-/g, " ") };
        }
        if (item && typeof item === "object" && "slug" in item) {
          const slug = String((item as RecentView).slug);
          const name = String((item as RecentView).name || slug.replace(/-/g, " "));
          return { slug, name };
        }
        return null;
      })
      .filter((x): x is RecentView => Boolean(x?.slug));
  } catch {
    return [];
  }
}

export function pushRecentlyViewed(entry: RecentView): void {
  if (typeof window === "undefined") return;
  const prev = readRecentlyViewed().filter((r) => r.slug !== entry.slug);
  const next = [entry, ...prev].slice(0, MAX_RECENTLY_VIEWED);
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
}
