// Phone-number detection inside supplier-uploaded images.
//
// Suppliers must only be reachable through the app — never via a phone number
// printed on a portfolio image / watermark. We run Cloudinary's OCR add-on
// (adv_ocr, Google Vision under the hood) on every uploaded asset and reject any
// image whose recognized text contains an Israeli phone number.
//
// Requires server-side credentials + the OCR add-on enabled on the account:
//   CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET  (Cloudinary OCR add-on must be on)
// Without them this is a no-op (allows the upload) so the app keeps working.

import crypto from "crypto";

const CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ??
  process.env.CLOUDINARY_CLOUD_NAME ??
  "deabfy2hy";
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export function ocrEnabled(): boolean {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

/**
 * Detects Israeli phone numbers in a blob of OCR'd text.
 * Strips spaces/dashes/dots/parens first, then looks for a 0- or 972-prefixed
 * run of 8–9 digits (mobile 05x-xxxxxxx, landline 0x-xxxxxxx, +972...).
 */
export function textContainsPhone(text: string): string | null {
  if (!text) return null;
  const compact = text.replace(/[\s\-.()‏‎]/g, "");
  const match = compact.match(/(?:\+?972|0)(?:\d){8,9}/);
  return match ? match[0] : null;
}

function sign(params: Record<string, string>): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + API_SECRET).digest("hex");
}

/** Extracts all recognized text from a Cloudinary adv_ocr response. */
function extractOcrText(info: unknown): string {
  try {
    // info.ocr.adv_ocr.data[].fullTextAnnotation.text (+ textAnnotations fallback)
    const data = (info as { ocr?: { adv_ocr?: { data?: unknown[] } } })?.ocr
      ?.adv_ocr?.data;
    if (!Array.isArray(data)) return "";
    const parts: string[] = [];
    for (const entry of data) {
      const e = entry as {
        fullTextAnnotation?: { text?: string };
        textAnnotations?: Array<{ description?: string }>;
      };
      if (e.fullTextAnnotation?.text) parts.push(e.fullTextAnnotation.text);
      else if (Array.isArray(e.textAnnotations)) {
        parts.push(e.textAnnotations.map((t) => t.description ?? "").join(" "));
      }
    }
    return parts.join("\n");
  } catch {
    return "";
  }
}

export interface PhoneScanResult {
  /** A phone number was detected in the image. */
  hasPhone: boolean;
  /** The matched number (for logging). */
  matched?: string;
  /** OCR was skipped (not configured) — caller should allow the upload. */
  skipped?: boolean;
}

/**
 * Runs OCR on an image (by URL) and reports whether it contains a phone number.
 *
 * Uses a signed `upload` with `file=<url>` + `ocr=adv_ocr` — the `explicit`
 * method silently ignores the OCR add-on for this account, whereas upload-by-URL
 * returns `info.ocr.adv_ocr` reliably. The scan produces a throwaway Cloudinary
 * asset which we destroy afterwards, leaving the supplier's real asset untouched.
 */
export async function scanImageForPhone(
  imageUrl: string
): Promise<PhoneScanResult> {
  if (!ocrEnabled()) return { hasPhone: false, skipped: true };
  if (!imageUrl) return { hasPhone: false, skipped: true };

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signed: Record<string, string> = { ocr: "adv_ocr", timestamp };

  const form = new URLSearchParams({
    file: imageUrl,
    ...signed,
    api_key: API_KEY!,
    signature: sign(signed),
  });

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: form, signal: AbortSignal.timeout(20_000) }
    );
    if (!res.ok) {
      console.error("[OCR] Cloudinary upload failed:", res.status, await res.text());
      // Fail open: don't block uploads on an OCR outage.
      return { hasPhone: false, skipped: true };
    }
    const json = (await res.json()) as { info?: unknown; public_id?: string };

    // Remove the throwaway scan copy (best-effort, awaited so it runs in serverless).
    if (json.public_id) await deleteCloudinaryAsset(json.public_id).catch(() => {});

    const text = extractOcrText(json.info);
    const matched = textContainsPhone(text);
    return matched ? { hasPhone: true, matched } : { hasPhone: false };
  } catch (err) {
    console.error("[OCR] scan error:", err);
    return { hasPhone: false, skipped: true };
  }
}

/** Best-effort deletion of a rejected asset (signed destroy). */
export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  if (!ocrEnabled()) return;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params: Record<string, string> = { public_id: publicId, timestamp };
  const form = new URLSearchParams({
    ...params,
    api_key: API_KEY!,
    signature: sign(params),
  });
  try {
    await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error("[OCR] destroy error:", err);
  }
}
