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
        src = new URL(src, url.toString()).toString(); // resolve relative → absolute
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
      /(?:data-src|data-lazy-src|data-original|data-srcset|srcset|src)=["']([^"']+)["']/gi;
    let tag: RegExpExecArray | null;
    while ((tag = tagRe.exec(html)) && images.size < 30) {
      let a: RegExpExecArray | null;
      attrRe.lastIndex = 0;
      while ((a = attrRe.exec(tag[0]))) addImage(a[1]);
    }

    // ── Phone (Israeli) ──
    const phoneMatch = html.match(/0\s?5\d([\s-]?\d){7}/);
    const phone = phoneMatch ? phoneMatch[0].replace(/\D/g, "") : null;

    return NextResponse.json({
      success: true,
      data: {
        sourceUrl: url.toString(),
        name: title || null,
        bioHe: description || null,
        phone,
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
