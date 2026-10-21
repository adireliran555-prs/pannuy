import { NextRequest, NextResponse } from "next/server";
import { requireSupplierSession } from "@/lib/api-auth";
import { getAppUrl } from "@/lib/app-url";
import { mirrorImagesParallel } from "@/lib/cloudinary-server";
import { resolveSiteImport } from "@/lib/landing-import";
import { parsePublicHttpUrl, safeFetch } from "@/lib/safe-fetch";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function fetchHeaders(): Record<string, string> {
  return {
    "User-Agent": `Mozilla/5.0 (compatible; PannuyBot/1.0; +${getAppUrl()})`,
    Accept: "text/html,application/xhtml+xml",
  };
}

async function fetchHtml(url: string): Promise<{ html: string; finalUrl: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    // SSRF guard: DNS-checked, manual redirects (max 3), each hop re-validated.
    const fetched = await safeFetch(url, {
      headers: fetchHeaders(),
      signal: controller.signal,
    });
    if (!fetched || !fetched.res.ok) return null;
    const html = (await fetched.res.text()).slice(0, 1_500_000);
    return { html, finalUrl: fetched.finalUrl || url };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  const { error } = requireSupplierSession(request);
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const url = parsePublicHttpUrl(String(body.url ?? ""));
  if (!url) {
    return NextResponse.json(
      { success: false, error: "כתובת אתר לא תקינה" },
      { status: 400 }
    );
  }

  const startedAt = Date.now();

  try {
    const { parsed, followedUrls } = await resolveSiteImport(url.toString(), fetchHtml);
    const mirrored = await mirrorImagesParallel(parsed.rawImages, 3);
    const durationMs = Date.now() - startedAt;

    return NextResponse.json({
      success: true,
      data: {
        sourceUrl: parsed.sourceUrl,
        followedUrls,
        name: parsed.name,
        bioHe: parsed.bioHe,
        phone: parsed.phone,
        email: parsed.email,
        category: parsed.category,
        serviceAreas: parsed.serviceAreas,
        basePriceFrom: parsed.basePriceFrom,
        basePriceTo: parsed.basePriceTo,
        packages: parsed.packages.filter((p) => p.price > 0),
        images: mirrored.map((m) => m.url),
        imageUploads: mirrored.map(({ url: imageUrl, publicId }) => ({ url: imageUrl, publicId })),
        stats: {
          durationMs,
          imagesFound: parsed.rawImages.length,
          imagesMirrored: mirrored.length,
          packagesFound: parsed.packages.filter((p) => p.price > 0).length,
          pagesScanned: followedUrls.length + 1,
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
