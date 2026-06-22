// Parses supplier landing pages into structured profile data.

export interface ImportedPackage {
  nameHe: string;
  price: number;
  hours?: number;
  includes: string[];
  isPopular: boolean;
}

export interface LandingImportResult {
  sourceUrl: string;
  name: string | null;
  bioHe: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
  serviceAreas: string[];
  basePriceFrom: number | null;
  basePriceTo: number | null;
  images: string[];
  packages: ImportedPackage[];
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function metaContent(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeEntities(m[1]);
  }
  return null;
}

export function normalizeText(value: string): string {
  return decodeEntities(value)
    .replace(/\s+/g, " ")
    .replace(/[|·•]+/g, " ")
    .trim();
}

export function stripHtml(html: string): string {
  return normalizeText(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

export function cleanBusinessName(title: string): string | null {
  const cleaned = normalizeText(title)
    .replace(/\s*-\s*דף הבית$/i, "")
    .replace(/\s*-\s*הצעת מחיר.*$/i, "");
  const parts = cleaned
    .split(/\s+[|–—]\s+|\s+-\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const candidate =
    parts.find((part) => !/הצעת מחיר|מחירון|price\s*list/i.test(part)) ?? parts[parts.length - 1] ?? cleaned;
  return candidate ? candidate.slice(0, 80) : null;
}

function hebrewParagraphs(html: string): string[] {
  return Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((m) => stripHtml(m[1]))
    .filter(
      (text) =>
        /[\u0590-\u05FF]/.test(text) &&
        text.length >= 25 &&
        !/כל הזכויות|מדיניות|facebook|instagram|info@|052-|050-|וואטסאפ/.test(text)
    );
}

export function extractBio(html: string, description: string): string | null {
  const paragraphs = hebrewParagraphs(html);
  const desc = normalizeText(description);

  const chunks: string[] = [];
  const seen = new Set<string>();
  for (const chunk of [desc, ...paragraphs]) {
    const key = chunk.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    chunks.push(key);
  }

  const combined = chunks.join(" ").trim();
  if (combined.length < 30) return null;
  return combined.slice(0, 500);
}

export function inferCategory(text: string): string | null {
  const rules: Array<[string, RegExp]> = [
    ["PHOTOGRAPHER", /צלמ|סטילס|צילום/i],
    ["VIDEOGRAPHER", /וידאו|סרט|קליפ/i],
    ["DJ", /\bדי\.?ג'?יי\b|תקליטן|מוזיקה/i],
    ["BRIDAL_SUITE", /סלון כלות|שמלת כלה|כלה/i],
    ["FLORIST", /פרח|עיצוב אירוע|עיצוב חופה/i],
    ["CATERING", /קייטרינג|אוכל|שף|מנות/i],
    ["VENUE", /אולם|גן אירועים|מתחם אירועים/i],
    ["HAIR_STYLIST", /שיער|תסרוק|מסרק/i],
    ["MAKEUP_ARTIST", /איפור|מאפר/i],
    ["PHOTO_BOOTH", /מגנט|פוטובוט|עמדת צילום/i],
    ["EVENT_PRODUCER", /מפיק|הפקה|הושבה/i],
  ];
  return rules.find(([, re]) => re.test(text))?.[0] ?? null;
}

const AREA_KEYWORDS = [
  "גוש דן",
  "תל אביב",
  "ירושלים",
  "חיפה",
  "הצפון",
  "הדרום",
  "השרון",
  "שפלה",
  "אילת",
  "מרכז",
];

export function extractAreas(text: string): string[] {
  const areas = new Set<string>();
  for (const area of AREA_KEYWORDS) {
    if (text.includes(area)) areas.add(area);
  }
  if (/כל הארץ|בכל הארץ|ארצי/.test(text)) {
    ["גוש דן", "תל אביב", "ירושלים", "חיפה", "הצפון", "הדרום", "השרון", "שפלה", "מרכז"].forEach(
      (area) => areas.add(area)
    );
  }
  return Array.from(areas);
}

/** Prices that appear next to a ₪ symbol — avoids phone numbers and image dimensions. */
export function extractShekelPrices(text: string): number[] {
  const amounts = new Set<number>();

  for (const m of text.matchAll(/(\d{1,2}(?:,\d{3})+|\d{3,5})\s*₪/g)) {
    const n = Number(m[1].replace(/,/g, ""));
    if (n >= 300 && n <= 100_000) amounts.add(n);
  }
  for (const m of text.matchAll(/₪\s*(\d{1,2}(?:,\d{3})+|\d{3,5})/g)) {
    const n = Number(m[1].replace(/,/g, ""));
    if (n >= 300 && n <= 100_000) amounts.add(n);
  }

  return Array.from(amounts).sort((a, b) => a - b);
}

export function extractPriceRange(
  text: string,
  mainPackagePrice: number | null
): { from: number | null; to: number | null } {
  if (mainPackagePrice) {
    const tierPrices = extractShekelPrices(text).filter((n) => n >= 3_000);
    const from = tierPrices.length > 0 ? Math.min(...tierPrices) : mainPackagePrice;
    const to = Math.max(mainPackagePrice, ...(tierPrices.length ? tierPrices : [mainPackagePrice]));
    return { from, to };
  }

  const tierPrices = extractShekelPrices(text).filter((n) => n >= 3_000);
  if (tierPrices.length === 0) return { from: null, to: null };
  return { from: tierPrices[0], to: tierPrices[tierPrices.length - 1] };
}

export function extractPackages(html: string, title: string): ImportedPackage[] {
  const packages: ImportedPackage[] = [];

  const mainIdx = html.search(/עלות החבילה|מחיר החבילה|חבילת חתונה/i);
  if (mainIdx >= 0) {
    const section = html.slice(Math.max(0, mainIdx - 10_000), mainIdx + 8_000);

    const headingPrices = Array.from(
      section.matchAll(/elementor-heading-title[^>]*>\s*([\d,]+)\s*<\/h[1-6]>/gi)
    )
      .map((m) => Number(m[1].replace(/,/g, "")))
      .filter((n) => n >= 3_000 && n <= 100_000);
    const price = headingPrices.length > 0 ? Math.max(...headingPrices) : null;

    const includes = Array.from(
      section.matchAll(/elementor-icon-list-text[^>]*>([^<]{8,160})/gi)
    )
      .map((m) => normalizeText(m[1]))
      .filter(
        (t) =>
          /[\u0590-\u05FF]/.test(t) &&
          !/מחיר|₪|facebook|instagram|more services/i.test(t)
      );

    if (price) {
      const offerMatch = title.match(/הצעת\s*מחיר\s*(\d+)/i);
      packages.push({
        nameHe: offerMatch ? `חבילה ${offerMatch[1]}` : "חבילת חתונה",
        price,
        includes: Array.from(new Set(includes)).slice(0, 12),
        isPopular: true,
      });
    }
  }

  const addons = Array.from(
    html.matchAll(/>\s*([^<]{12,160}?)\s*מחיר:\s*([\d,]+)\s*₪/gi)
  )
    .map((m) => ({
      name: normalizeText(m[1]).replace(/^>\s*/, ""),
      price: Number(m[2].replace(/,/g, "")),
    }))
    .filter((a) => a.name.length >= 8 && a.price >= 200 && a.price <= 20_000);

  for (const addon of addons) {
    if (packages.length >= 3) break;
    packages.push({
      nameHe: addon.name.slice(0, 80),
      price: addon.price,
      includes: [],
      isPopular: false,
    });
  }

  return packages.slice(0, 3);
}

function isPortfolioImage(src: string): boolean {
  if (/sprite|logo|icon|favicon|placeholder|pixel|1x1|avatar|loading|spinner/i.test(src)) {
    return false;
  }
  if (/Asset-\d|\/logo|banner|header-bg/i.test(src)) return false;
  if (/\.svg(\?|$)/i.test(src)) return false;

  const dim = src.match(/-(\d{3,4})x(\d{2,4})\./i);
  if (dim) {
    const w = Number(dim[1]);
    const h = Number(dim[2]);
    if (w > 0 && h > 0 && w / h > 2.4) return false;
  }
  return true;
}

export function extractImages(html: string, finalUrl: string, max = 30): string[] {
  const images = new Set<string>();
  const base = new URL(finalUrl);

  const addImage = (raw: string | null | undefined) => {
    if (!raw || images.size >= max) return;
    let src = raw.trim();
    if (!src || src.startsWith("data:")) return;

    if (src.includes(",") && / \d+(w|x)/.test(src)) {
      src = src.split(",")[0].trim().split(/\s+/)[0];
    }
    if (!isPortfolioImage(src)) return;

    try {
      src = new URL(src, base.toString()).toString();
    } catch {
      return;
    }
    if (src.startsWith("http")) images.add(src);
  };

  addImage(
    metaContent(html, [/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i])
  );

  const tagRe = /<img\b[^>]*>/gi;
  const attrRe =
    /(?:data-bg|data-background|data-src|data-lazy-src|data-original|data-srcset|srcset|src)=["']([^"']+)["']/gi;
  let tag: RegExpExecArray | null;
  while ((tag = tagRe.exec(html)) && images.size < max) {
    let a: RegExpExecArray | null;
    attrRe.lastIndex = 0;
    while ((a = attrRe.exec(tag[0]))) addImage(a[1]);
  }

  const bgRe = /background(?:-image)?\s*:\s*url\((['"]?)([^'")]+)\1\)/gi;
  let bg: RegExpExecArray | null;
  while ((bg = bgRe.exec(html)) && images.size < max) addImage(bg[2]);

  return Array.from(images);
}

export function parseLandingPage(html: string, finalUrl: string): Omit<LandingImportResult, "images"> & {
  rawImages: string[];
} {
  const text = stripHtml(html);

  const pageTitle =
    metaContent(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<title[^>]*>([^<]+)<\/title>/i,
    ]) ?? "";
  const siteName =
    metaContent(html, [/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i]) ?? "";

  const description =
    metaContent(html, [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    ]) ?? "";

  const packages = extractPackages(html, pageTitle);
  const mainPrice = packages[0]?.price ?? null;
  const priceRange = extractPriceRange(text, mainPrice);
  const phoneMatch = text.match(/(?:\+972|0)\s?5\d(?:[\s-]?\d){7}/);
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

  return {
    sourceUrl: finalUrl,
    name: cleanBusinessName(pageTitle || siteName),
    bioHe: extractBio(html, description),
    phone: phoneMatch ? phoneMatch[0].replace(/^\+972/, "0").replace(/\D/g, "") : null,
    email: emailMatch?.[0] ?? null,
    category: inferCategory(`${pageTitle} ${siteName} ${description} ${text}`),
    serviceAreas: extractAreas(text),
    basePriceFrom: priceRange.from,
    basePriceTo: priceRange.to,
    packages,
    rawImages: extractImages(html, finalUrl),
  };
}
