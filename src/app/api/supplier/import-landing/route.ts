import { NextRequest, NextResponse } from "next/server";
import { requireSupplierSession } from "@/lib/api-auth";
import { mirrorImagesParallel } from "@/lib/cloudinary-server";
import {
  findPricingPageUrls,
  importRichnessScore,
  isSparseImport,
  parseLandingPage,
} from "@/lib/landing-import";

// Imports a supplier's existing website / landing page: fetches it server-side,
// follows pricing links when needed, extracts profile data, mirrors photos to Cloudinary.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; PannuyBot/1.0; +https://pannuy.vercel.app)",
  Accept: "text/html,application/xhtml+xml",
};

function isSafeUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase();
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

async function fetchHtml(url: string): Promise<{ html: string; finalUrl: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 1_500_000);
    return { html, finalUrl: res.url || url };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveBestPage(startUrl: string): Promise<{
  html: string;
  finalUrl: string;
  followedUrl: string | null;
}> {
  const initial = await fetchHtml(startUrl);
  if (!initial) throw new Error("FETCH_FAILED");

  let best = {
    html: initial.html,
    finalUrl: initial.finalUrl,
    parsed: parseLandingPage(initial.html, initial.finalUrl),
    followedUrl: null as string | null,
  };

  if (!isSparseImport(best.parsed)) {
    return { html: best.html, finalUrl: best.finalUrl, followedUrl: null };
  }

  const candidates = findPricingPageUrls(initial.html, initial.finalUrl).filter(
    (candidate) => candidate !== initial.finalUrl && candidate !== startUrl
  );

  for (const candidate of candidates.slice(0, 3)) {
    const fetched = await fetchHtml(candidate);
    if (!fetched) continue;
    const parsed = parseLandingPage(fetched.html, fetched.finalUrl);
    if (importRichnessScore(parsed) > importRichnessScore(best.parsed)) {
      best = {
        html: fetched.html,
        finalUrl: fetched.finalUrl,
        parsed,
        followedUrl: fetched.finalUrl,
      };
    }
    if (!isSparseImport(parsed)) break;
  }

  return {
    html: best.html,
    finalUrl: best.finalUrl,
    followedUrl: best.followedUrl,
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

  const startedAt = Date.now();

  try {
    const { html, finalUrl, followedUrl } = await resolveBestPage(url.toString());
    const parsed = parseLandingPage(html, finalUrl);
    const mirrored = await mirrorImagesParallel(parsed.rawImages, 3);

    const durationMs = Date.now() - startedAt;

    return NextResponse.json({
      success: true,
      data: {
        sourceUrl: finalUrl,
        followedUrl,
        name: parsed.name,
        bioHe: parsed.bioHe,
        phone: parsed.phone,
        email: parsed.email,
        category: parsed.category,
        serviceAreas: parsed.serviceAreas,
        basePriceFrom: parsed.basePriceFrom,
        basePriceTo: parsed.basePriceTo,
        packages: parsed.packages,
        images: mirrored.map((m) => m.url),
        imageUploads: mirrored.map(({ url: imageUrl, publicId }) => ({ url: imageUrl, publicId })),
        stats: {
          durationMs,
          imagesFound: parsed.rawImages.length,
          imagesMirrored: mirrored.length,
          packagesFound: parsed.packages.length,
          followedPricingPage: Boolean(followedUrl),
        },
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
