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

export async function mirrorImageToCloudinary(
  remoteUrl: string,
  publicIdPrefix?: string
): Promise<MirroredImage | null> {
  if (!cloudinaryServerEnabled()) return null;

  try {
    const form = new FormData();
    form.append("file", remoteUrl);
    form.append("upload_preset", UPLOAD_PRESET!);
    if (publicIdPrefix) {
      form.append("public_id", `${publicIdPrefix}-${Date.now()}`);
    }

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { secure_url?: string; public_id?: string };
    if (!json.secure_url || !json.public_id) return null;
    return { url: json.secure_url, publicId: json.public_id };
  } catch {
    return null;
  }
}
