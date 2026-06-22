// Server-side Cloudinary upload (unsigned preset). Used to mirror remote landing-page
// images so they render reliably in the app instead of hotlinking supplier sites.

const CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME ?? "deabfy2hy";
const UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? process.env.CLOUDINARY_UPLOAD_PRESET ?? "pannuy";

export function cloudinaryServerEnabled(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

export interface MirroredImage {
  url: string;
  publicId: string;
}

async function uploadBlob(blob: Blob, publicIdPrefix?: string): Promise<MirroredImage | null> {
  const form = new FormData();
  form.append("file", blob, "import.jpg");
  form.append("upload_preset", UPLOAD_PRESET!);
  if (publicIdPrefix) {
    form.append("public_id", `${publicIdPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) return null;

  const json = (await res.json()) as { secure_url?: string; public_id?: string };
  if (!json.secure_url || !json.public_id) return null;
  return { url: json.secure_url, publicId: json.public_id };
}

export async function mirrorImageToCloudinary(
  remoteUrl: string,
  publicIdPrefix = "landing"
): Promise<MirroredImage | null> {
  if (!cloudinaryServerEnabled()) return null;

  try {
    const origin = new URL(remoteUrl).origin;
    const imgRes = await fetch(remoteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PannuyBot/1.0)",
        Accept: "image/*",
        Referer: `${origin}/`,
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!imgRes.ok) return null;

    const contentType = imgRes.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const blob = await imgRes.blob();
    if (blob.size < 4_000) return null;

    return uploadBlob(blob, publicIdPrefix);
  } catch {
    return null;
  }
}

export async function mirrorImagesParallel(
  urls: string[],
  limit = 3
): Promise<Array<{ url: string; publicId: string; sourceUrl: string }>> {
  const results: Array<{ url: string; publicId: string; sourceUrl: string }> = [];
  const queue = urls.slice(0, 15);

  for (let i = 0; i < queue.length; i += limit) {
    const batch = queue.slice(i, i + limit);
    const mirrored = await Promise.all(
      batch.map(async (sourceUrl) => {
        const uploaded = await mirrorImageToCloudinary(sourceUrl);
        if (uploaded) return { ...uploaded, sourceUrl };
        return null;
      })
    );
    for (const item of mirrored) {
      if (item) results.push(item);
    }
  }

  return results;
}
