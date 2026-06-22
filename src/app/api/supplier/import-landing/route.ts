import { NextRequest, NextResponse } from "next/server";
import { requireSupplierSession } from "@/lib/api-auth";
import { mirrorImageToCloudinary } from "@/lib/cloudinary-server";
import { parseLandingPage } from "@/lib/landing-import";

// Imports a supplier's existing website / landing page: fetches it server-side,
// extracts images + key text, mirrors photos to Cloudinary, and returns structured data.

export const dynamic = "force-dynamic";

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

async function mirrorImages(urls: string[]): Promise<Array<{ url: string; publicId: string }>> {
  const mirrored: Array<{ url: string; publicId: string }> = [];
  for (const remoteUrl of urls.slice(0, 15)) {
    const uploaded = await mirrorImageToCloudinary(remoteUrl, "landing");
    if (uploaded) {
      mirrored.push(uploaded);
    } else {
      mirrored.push({ url: remoteUrl, publicId: `import-${Date.now()}-${mirrored.length}` });
    }
  }
  return mirrored;
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
    const timeout = setTimeout(() => controller.abort(), 15_000);
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

    const html = (await res.text()).slice(0, 1_500_000);
    const finalUrl = res.url || url.toString();
    const parsed = parseLandingPage(html, finalUrl);
    const mirrored = await mirrorImages(parsed.rawImages);

    return NextResponse.json({
      success: true,
      data: {
        sourceUrl: parsed.sourceUrl,
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
        imageUploads: mirrored,
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
