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

export function cleanBioText(text: string): string {
  return normalizeText(text)
    .replace(/\s*בניה וקידום אתרים.*$/i, "")
    .replace(/\s*טופיק מדיה.*$/i, "")
    .replace(/\s*כל הזכויות שמורות.*$/i, "")
    .replace(/\s*Oren Sonego.*$/i, "")
    .trim();
}

export function cleanBusinessName(title: string, siteName?: string | null): string | null {
  const cleanSite =
    siteName &&
    normalizeText(siteName).replace(/0\d{1,2}[-\s]?\d{7}/g, "").trim();
  if (cleanSite && cleanSite.length >= 2 && cleanSite.length <= 40 && !/צרו קשר/i.test(cleanSite)) {
    return cleanSite.slice(0, 80);
  }

  const cleaned = normalizeText(title)
    .replace(/0\d{1,2}[-\s]?\d{7}/g, "")
    .replace(/צרו קשר/gi, "")
    .replace(/\s*-\s*דף הבית$/i, "")
    .replace(/\s*-\s*הצעת מחיר.*$/i, "")
    .trim();
  const parts = cleaned
    .split(/\s+[|–—]\s+|\s+-\s+|,/)
    .map((part) => part.trim())
    .filter(Boolean);
  const candidate =
    parts.find(
      (part) =>
        part.length >= 2 &&
        part.length <= 40 &&
        !/הצעת מחיר|מחירון|price\s*list|צילומי תדמית|נדלן ועסקים/i.test(part)
    ) ?? parts[0] ?? cleaned;
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
  return cleanBioText(combined).slice(0, 500) || null;
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

  const addons = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((m) => stripHtml(m[1].replace(/<br\s*\/?>/gi, " ")))
    .filter((text) => /מחיר:\s*[\d,]+\s*₪/.test(text) && text.length >= 15)
    .map((text) => {
      const priceMatch = text.match(/מחיר:\s*([\d,]+)\s*₪/);
      const name = text.replace(/מחיר:\s*[\d,]+\s*₪.*$/i, "").trim();
      return {
        name,
        price: priceMatch ? Number(priceMatch[1].replace(/,/g, "")) : 0,
      };
    })
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

/** Service blocks on marketing homepages (Elementor flip-box / heading + paragraph). */
export function extractServiceSectionsAsPackages(html: string): ImportedPackage[] {
  const packages: ImportedPackage[] = [];
  const seen = new Set<string>();

  const blocks = Array.from(
    html.matchAll(
      /<h3[^>]*class="[^"]*elementor-heading-title[^"]*"[^>]*>([\s\S]*?)<\/h3>[\s\S]{0,1200}?<p[^>]*>([\s\S]*?)<\/p>/gi
    )
  );

  for (const block of blocks) {
    const name = stripHtml(block[1]);
    const desc = cleanBioText(stripHtml(block[2]));
    if (name.length < 4 || desc.length < 20 || seen.has(name)) continue;
    if (/השאירו פרטים|בואו נדבר|השירותים שלי/i.test(name)) continue;
    seen.add(name);
    packages.push({
      nameHe: name.slice(0, 80),
      price: 0,
      includes: desc.length > 120 ? [desc.slice(0, 200)] : [desc],
      isPopular: packages.length === 0,
    });
    if (packages.length >= 3) break;
  }

  return packages;
}

function isPortfolioImage(src: string): boolean {
  if (/sprite|logo|icon|favicon|placeholder|pixel|1x1|avatar|loading|spinner/i.test(src)) {
    return false;
  }
  if (/youtube|ytimg|vimeo|wp-rocket|play-button|video-thumb|googleusercontent/i.test(src)) {
    return false;
  }
  if (/LOGO|logo-white|\/logo[-_]|favicon/i.test(src)) return false;
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

  // Elementor / WordPress often embed image URLs in JSON or inline CSS — not only <img>.
  for (const m of html.matchAll(
    /(https?:\/\/[^"'\\s]+)?\/wp-content\/uploads\/[^"'\\s,;)]+?\.(?:jpe?g|png|webp)(?:\?[^"'\\s,;)]*)?/gi
  )) {
    addImage(m[0]);
  }

  return Array.from(images);
}

export function findPricingPageUrls(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const urls = new Set<string>();

  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = m[1];
    const label = stripHtml(m[2]);
    if (/הצעת\s*מחיר|מחירון|חבילות|price\s*list|pricing/i.test(`${label} ${href}`)) {
      try {
        urls.add(new URL(href, base).toString());
      } catch {
        /* skip */
      }
    }
  }

  for (const m of html.matchAll(/href=["']([^"']*(?:הצעת-מחיר|price-list|pricing|מחיר)[^"']*)["']/gi)) {
    try {
      urls.add(new URL(m[1], base).toString());
    } catch {
      /* skip */
    }
  }

  return Array.from(urls);
}

export function scoreCandidateUrl(url: string): number {
  let score = 0;
  const decoded = decodeURIComponent(url).toLowerCase();
  if (/הצעת-מחיר|הצעת.%d7%9e%d7%97%d7%99%d7%a8|pricelist|price-list/i.test(decoded)) {
    score += 40;
  }
  if (/חתונה|wedding|יום-מרוכז/i.test(decoded)) score += 12;
  if (/צילומי|portfolio|gallery|תדמית/i.test(decoded)) score += 6;
  try {
    const path = new URL(url).pathname;
    if (path === "/" || path === "") score += 8;
  } catch {
    /* skip */
  }
  return score;
}

export async function discoverSitePageUrls(
  siteUrl: string,
  fetchText: (url: string) => Promise<string | null>
): Promise<string[]> {
  const origin = new URL(siteUrl).origin;
  const found = new Set<string>([siteUrl]);

  const sitemapCandidates = [
    `${origin}/page-sitemap.xml`,
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
  ];

  for (const sitemapUrl of sitemapCandidates) {
    const xml = await fetchText(sitemapUrl);
    if (!xml) continue;

    const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
    for (const loc of locs) {
      if (loc.endsWith(".xml")) {
        const childXml = await fetchText(loc);
        if (!childXml) continue;
        for (const childLoc of childXml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
          try {
            const u = new URL(childLoc[1]);
            if (u.origin === origin && !u.pathname.endsWith(".xml")) found.add(u.toString());
          } catch {
            /* skip */
          }
        }
      } else {
        try {
          const u = new URL(loc);
          if (u.origin === origin) found.add(u.toString());
        } catch {
          /* skip */
        }
      }
    }
    if (found.size > 1) break;
  }

  return Array.from(found)
    .sort((a, b) => scoreCandidateUrl(b) - scoreCandidateUrl(a))
    .slice(0, 6);
}

type ParsedPage = ReturnType<typeof parseLandingPage>;

function quotePageScore(page: ParsedPage): number {
  let score = importRichnessScore(page);
  const blob = `${page.packages.map((p) => p.includes.join(" ")).join(" ")} ${page.bioHe ?? ""}`;
  if (/אורן סונגו/.test(blob)) score += 30;
  try {
    const path = decodeURIComponent(new URL(page.sourceUrl).pathname);
    if (/הצעת-מחיר-3|הצעת-מחיר-11/i.test(path)) score += 20;
  } catch {
    /* skip */
  }
  return score;
}

export function mergeLandingPages(pages: ParsedPage[], startUrl: string): ParsedPage {
  if (pages.length === 0) {
    throw new Error("NO_PAGES");
  }

  const sorted = [...pages].sort((a, b) => importRichnessScore(b) - importRichnessScore(a));
  const richest = sorted[0];
  const quotePages = pages.filter((p) => p.packages.some((pkg) => pkg.price >= 3_000));
  const bestQuote =
    [...quotePages].sort((a, b) => quotePageScore(b) - quotePageScore(a))[0] ?? richest;
  const home =
    pages.find((p) => {
      try {
        const path = new URL(p.sourceUrl).pathname.replace(/\/$/, "");
        return path === "" || path === "/";
      } catch {
        return false;
      }
    }) ?? pages.find((p) => p.sourceUrl === startUrl) ?? pages[0];

  const images = new Set<string>();
  for (const page of pages) {
    for (const img of page.rawImages) images.add(img);
  }

  const packageMap = new Map<string, ImportedPackage>();
  for (const pkg of bestQuote.packages) {
    if (pkg.price > 0) packageMap.set(pkg.nameHe, pkg);
  }
  let packages = Array.from(packageMap.values()).slice(0, 3);
  if (packages.length === 0) {
    const homeHtml = (home as ParsedPage & { _html?: string })._html ?? "";
    packages = extractServiceSectionsAsPackages(homeHtml).slice(0, 3);
  }

  const bios = pages.map((p) => p.bioHe).filter(Boolean) as string[];
  const bioHe = bios.sort((a, b) => b.length - a.length)[0] ?? null;

  const serviceAreas = Array.from(new Set(pages.flatMap((p) => p.serviceAreas)));

  return {
    sourceUrl: startUrl,
    name: home.name ?? richest.name,
    bioHe: bioHe ? cleanBioText(bioHe).slice(0, 500) : null,
    phone: pages.map((p) => p.phone).find(Boolean) ?? null,
    email: pages.map((p) => p.email).find(Boolean) ?? null,
    category: bestQuote.category ?? home.category,
    serviceAreas,
    basePriceFrom: bestQuote.basePriceFrom ?? home.basePriceFrom,
    basePriceTo: bestQuote.basePriceTo ?? home.basePriceTo,
    packages,
    rawImages: Array.from(images).slice(0, 30),
  };
}

export async function resolveSiteImport(
  startUrl: string,
  fetchHtml: (url: string) => Promise<{ html: string; finalUrl: string } | null>
): Promise<{ parsed: ParsedPage; followedUrls: string[] }> {
  const fetchText = async (url: string) => {
    const res = await fetchHtml(url);
    return res?.html ?? null;
  };

  const candidates = await discoverSitePageUrls(startUrl, fetchText);
  const followedUrls: string[] = [];
  const parsedPages: Array<ParsedPage & { _html?: string }> = [];

  for (const candidate of candidates) {
    const fetched = await fetchHtml(candidate);
    if (!fetched) continue;
    if (candidate !== startUrl) followedUrls.push(fetched.finalUrl);
    const parsed = parseLandingPage(fetched.html, fetched.finalUrl);
    parsedPages.push({ ...parsed, _html: fetched.html });
  }

  if (parsedPages.length === 0) throw new Error("FETCH_FAILED");

  const merged = mergeLandingPages(parsedPages, startUrl);
  return { parsed: merged, followedUrls };
}

export function importRichnessScore(
  parsed: Pick<
    LandingImportResult,
    "bioHe" | "basePriceFrom" | "packages" | "serviceAreas"
  > & { rawImages: string[] }
): number {
  let score = 0;
  score += parsed.rawImages.length;
  score += parsed.packages.length * 12;
  if (parsed.basePriceFrom) score += 8;
  if ((parsed.bioHe?.length ?? 0) >= 200) score += 6;
  score += parsed.serviceAreas.length;
  return score;
}

export function isSparseImport(
  parsed: Pick<LandingImportResult, "basePriceFrom" | "packages"> & { rawImages: string[] }
): boolean {
  return parsed.packages.length === 0 && parsed.rawImages.length < 3 && !parsed.basePriceFrom;
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
    name: cleanBusinessName(pageTitle || siteName, siteName),
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
