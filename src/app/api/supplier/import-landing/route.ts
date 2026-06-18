import { NextRequest, NextResponse } from "next/server";
import { requireSupplierSession } from "@/lib/api-auth";

// Imports a supplier's existing website / landing page: fetches it server-side,
// extracts images + key text, and returns structured data to prefill the profile.

export const dynamic = "force-dynamic";

function isSafeUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase();
    // Block SSRF to local/private hosts.
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.endsWith(".local") ||
      /^(10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
    ) {
      return null;
    }
    return u;
  } catch {
    return null;
  }
}

function decodeEntities(s: string): string {
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

function metaContent(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeEntities(m[1]);
  }
  return null;
}

function normalizeText(value: string): string {
  return decodeEntities(value)
    .replace(/\s+/g, " ")
    .replace(/[|·•]+/g, " ")
    .trim();
}

function stripHtml(html: string): string {
  return normalizeText(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function cleanBusinessName(title: string): string | null {
  const cleaned = normalizeText(title)
    .replace(/\s*-\s*דף הבית$/i, "")
    .replace(/\s*-\s*הצעת מחיר.*$/i, "");
  const parts = cleaned
    .split(/\s+[|–—]\s+|\s+-\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const candidate = parts.find((part) => !/הצעת מחיר|מחירון|חתונה/i.test(part)) ?? parts[0] ?? cleaned;
  return candidate ? candidate.slice(0, 80) : null;
}

function extractBio(html: string, description: string): string | null {
  if (description.trim().length >= 40) return normalizeText(description).slice(0, 500);

  const blocks = Array.from(html.matchAll(/<(?:p|h1|h2|h3)\b[^>]*>([\s\S]*?)<\/(?:p|h1|h2|h3)>/gi))
    .map((m) => stripHtml(m[1]))
    .filter((text) => /[\u0590-\u05FF]/.test(text) && text.length >= 35)
    .filter((text) => !/כל הזכויות|מדיניות|וואטסאפ|טלפון|השאירו פרטים/.test(text));

  return blocks.slice(0, 3).join(" ").slice(0, 500) || null;
}

function inferCategory(text: string): string | null {
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

function extractAreas(text: string): string[] {
  const areas = new Set<string>();
  for (const area of AREA_KEYWORDS) {
    if (text.includes(area)) areas.add(area);
  }
  if (/כל הארץ|בכל הארץ|ארצי/.test(text)) {
    ["גוש דן", "תל אביב", "ירושלים", "חיפה", "הצפון", "הדרום", "השרון", "שפלה", "מרכז"].forEach((area) =>
      areas.add(area)
    );
  }
  return Array.from(areas);
}

function extractPriceRange(text: string): { from: number | null; to: number | null } {
  const amounts = Array.from(
    text.matchAll(/(?:₪\s*)?(\d{1,3}(?:[,\s]\d{3})+|\d{4,5})(?:\s*₪)?/g)
  )
    .map((m) => Number(m[1].replace(/[,\s]/g, "")))
    .filter((n) => n >= 500 && n <= 100000 && !String(n).startsWith("202"));

  const unique = Array.from(new Set(amounts)).sort((a, b) => a - b);
  return {
    from: unique[0] ?? null,
    to: unique.length > 1 ? unique[unique.length - 1] : null,
  };
}

export async function POST(request: NextRequest) {
  const { error } = requireSupplierSession(request);
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const url = isSafeUrl(String(body.url ?? ""));
  if (!url) {
    return NextResponse.json(
      { success: false, error: "כתובת אתר לא תקינה" },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PannuyBot/1.0; +https://pannuy.vercel.app)",
        Accept: "text/html",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "לא הצלחנו לטעון את האתר" },
        { status: 422 }
      );
    }
    const html = (await res.text()).slice(0, 1_500_000); // cap 1.5MB
    const finalUrl = res.url || url.toString();
    const text = stripHtml(html);

    // ── Title / name ──
    const title =
      metaContent(html, [
        /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
        /<title[^>]*>([^<]+)<\/title>/i,
      ]) ?? "";

    // ── Description / bio ──
    const description =
      metaContent(html, [
        /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      ]) ?? "";
    const bioHe = extractBio(html, description);
    const priceRange = extractPriceRange(text);

    // ── Images ──
    const images = new Set<string>();
    const addImage = (raw: string | null | undefined) => {
      if (!raw || images.size >= 30) return;
      let src = raw.trim();
      if (!src || src.startsWith("data:")) return;
      // srcset → take the first candidate URL
      if (src.includes(",") && / \d+(w|x)/.test(src)) {
        src = src.split(",")[0].trim().split(/\s+/)[0];
      }
      if (/\.svg(\?|$)/i.test(src)) return; // skip vector icons
      if (/sprite|logo|icon|favicon|placeholder|pixel|1x1|avatar|loading|spinner/i.test(src))
        return;
      try {
        src = new URL(src, finalUrl).toString(); // resolve relative → absolute
      } catch {
        return;
      }
      if (src.startsWith("http")) images.add(src);
    };

    addImage(
      metaContent(html, [
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      ])
    );

    // <img> with src AND common lazy-load attributes (data-src, data-lazy-src,
    // data-original, srcset) — many sites put the real URL in a data-* attr.
    const tagRe = /<img\b[^>]*>/gi;
    const attrRe =
      /(?:data-bg|data-background|data-src|data-lazy-src|data-original|data-srcset|srcset|src)=["']([^"']+)["']/gi;
    let tag: RegExpExecArray | null;
    while ((tag = tagRe.exec(html)) && images.size < 30) {
      let a: RegExpExecArray | null;
      attrRe.lastIndex = 0;
      while ((a = attrRe.exec(tag[0]))) addImage(a[1]);
    }

    const bgRe = /background(?:-image)?\s*:\s*url\((['"]?)([^'")]+)\1\)/gi;
    let bg: RegExpExecArray | null;
    while ((bg = bgRe.exec(html)) && images.size < 30) addImage(bg[2]);

    // ── Phone (Israeli) ──
    const phoneMatch = text.match(/(?:\+972|0)\s?5\d(?:[\s-]?\d){7}/);
    const phone = phoneMatch
      ? phoneMatch[0].replace(/^\+972/, "0").replace(/\D/g, "")
      : null;
    const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const category = inferCategory(`${title} ${description} ${text}`);
    const serviceAreas = extractAreas(text);

    return NextResponse.json({
      success: true,
      data: {
        sourceUrl: finalUrl,
        name: cleanBusinessName(title),
        bioHe,
        phone,
        email: emailMatch?.[0] ?? null,
        category,
        serviceAreas,
        basePriceFrom: priceRange.from,
        basePriceTo: priceRange.to,
        images: Array.from(images).slice(0, 15),
      },
    });
  } catch (err) {
    console.error("[POST /api/supplier/import-landing]", err);
    return NextResponse.json(
      { success: false, error: "לא הצלחנו לנתח את האתר. נסו כתובת אחרת." },
      { status: 422 }
    );
  }
}
