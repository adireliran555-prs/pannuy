// Personal-contact-detail detection for supplier-authored content.
//
// Rule: the only first contact between a customer and a supplier is an intro
// meeting booked on the site. Phones, emails, links and social handles are
// therefore never allowed in profile text, package text or images.

export type PiiKind = "phone" | "email" | "url" | "social";

export interface PiiHit {
  kind: PiiKind;
  match: string;
  index: number;
}

// Israeli phones: 05X mobile, 0[2-9] landline, +972 / 972 / 00972 prefix.
// Digits may be separated by spaces, dashes, dots, parens, RTL/LTR marks.
const SEP = "[\\s\\-.()\\u200e\\u200f\\u202a-\\u202e]*";
const D = (n: number) => `(?:\\d${SEP}){${n}}`;
const PHONE_RE = new RegExp(
  "(?<![\\d])(?:" +
    `(?:\\+|00)?${SEP}972${SEP}\\(?0?\\)?${SEP}[2-9]${SEP}${D(7)}\\d` + // +972-5X-XXXXXXX / +972-X-XXXXXXX
    `|0${SEP}5${SEP}\\d${SEP}${D(6)}\\d` + // 05X-XXXXXXX
    `|0${SEP}[2-9]${SEP}${D(6)}\\d` + // 0X-XXXXXXX landline
    `|0${SEP}7${SEP}[2-9]${SEP}${D(6)}\\d` + // 07X-XXXXXXX
    ")(?![\\d])",
  "g"
);

const EMAIL_RE = /[A-Za-z0-9._%+-]+\s*(?:@|\(at\)|\[at\]|＠)\s*[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

const URL_RE =
  /(?:https?:\/\/|www\.)[^\s<>"']+|(?<![\w@])(?:[a-z0-9-]+\.)+(?:co\.il|org\.il|net\.il|ac\.il|com|net|org|io|me|info|biz|site|online|shop|link|app|co|il)(?:\/[^\s<>"']*)?(?![\w])/gi;

const SOCIAL_RE =
  /(?:instagram|facebook|fb|tiktok|wa|t|telegram|snapchat|linkedin|youtube)\.(?:com|me)\/[^\s<>"']+|(?<![\p{L}\d])(?:whatsapp|וואטסאפ|ואטסאפ|וטסאפ|טלגרם|telegram)(?![\p{L}\d])[^\n]{0,40}|(?:אינסטגרם|אינסטה|instagram|insta|טיקטוק|tiktok|פייסבוק|facebook|fb)\s*[:：\-–]?\s*@?[A-Za-z0-9_.]{3,}|(?<![\w])@[A-Za-z0-9_.]{3,}(?![\w])/giu;

function collect(text: string, re: RegExp, kind: PiiKind, out: PiiHit[]) {
  re.lastIndex = 0;
  for (const m of text.matchAll(re)) {
    const match = m[0].trim();
    if (!match) continue;
    out.push({ kind, match, index: m.index ?? 0 });
  }
}

/** Finds phones, emails, URLs and social handles in free text. */
export function findPii(text: string | null | undefined): PiiHit[] {
  if (!text) return [];
  const hits: PiiHit[] = [];
  collect(text, EMAIL_RE, "email", hits);
  collect(text, URL_RE, "url", hits);
  collect(text, SOCIAL_RE, "social", hits);
  collect(text, PHONE_RE, "phone", hits);
  // Drop phone hits that are actually prices / years etc.: require ≥9 digits.
  return hits
    .filter((h) => h.kind !== "phone" || h.match.replace(/\D/g, "").length >= 9)
    .sort((a, b) => a.index - b.index);
}

/** Convenience: first hit or null. */
export function firstPii(text: string | null | undefined): PiiHit | null {
  return findPii(text)[0] ?? null;
}

/** Replaces every hit with "[הוסר]". */
export function redactPii(text: string | null | undefined): string {
  if (!text) return text ?? "";
  const hits = findPii(text);
  if (hits.length === 0) return text;
  let out = "";
  let cursor = 0;
  for (const h of hits) {
    if (h.index < cursor) continue; // overlapping hit already redacted
    out += text.slice(cursor, h.index) + "[הוסר]";
    cursor = h.index + h.match.length;
  }
  return out + text.slice(cursor);
}

export const PII_ERROR_MESSAGE =
  "אסור לכלול פרטי התקשרות (טלפון, מייל, קישורים או רשתות חברתיות) בפרופיל. הקשר עם לקוחות נעשה דרך פגישת היכרות באתר.";

export function piiErrorMessage(): string {
  return PII_ERROR_MESSAGE;
}

/**
 * Scans a map of field → text (or string[]) and returns the first offending
 * field with its hits, or null when clean.
 */
export function scanFields(
  fields: Record<string, string | string[] | null | undefined>
): { field: string; hits: PiiHit[] } | null {
  for (const [field, value] of Object.entries(fields)) {
    if (value == null) continue;
    const texts = Array.isArray(value) ? value : [value];
    const hits = texts.flatMap((t) => findPii(t));
    if (hits.length > 0) return { field, hits };
  }
  return null;
}
