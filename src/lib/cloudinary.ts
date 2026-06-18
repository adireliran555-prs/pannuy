// Client-side unsigned Cloudinary upload. Needs two public env vars:
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME   — your Cloudinary cloud name
//   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET — an UNSIGNED upload preset
// No API secret is exposed (unsigned preset). When unset, uploads are disabled
// and the UI falls back to URL / landing-page import.

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "deabfy2hy";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "pannuy";

export function cloudinaryEnabled(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

export interface UploadedImage {
  url: string;
  publicId: string;
}

export async function uploadToCloudinary(file: File): Promise<UploadedImage> {
  if (!cloudinaryEnabled()) {
    throw new Error("Cloudinary is not configured");
  }
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET!);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: form }
  );
  if (!res.ok) {
    throw new Error("Upload failed");
  }
  const json = await res.json();
  return { url: json.secure_url as string, publicId: json.public_id as string };
}
