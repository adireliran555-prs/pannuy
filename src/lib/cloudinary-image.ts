// Inject Cloudinary delivery transforms (resize + auto format/quality) into an
// upload URL. No-ops for non-Cloudinary URLs (e.g. local placeholders) and for
// URLs that already carry a transformation, so it is always safe to apply.
export function cld(url: string | undefined | null, transform: string): string {
  if (!url) return "/placeholder-supplier.svg";
  if (!url.includes("res.cloudinary.com/") || !url.includes("/upload/")) {
    return url;
  }
  // Already transformed (named transform or version-only segment right after
  // /upload/). Leave it untouched to avoid double-processing.
  const afterUpload = url.split("/upload/")[1] ?? "";
  if (/^[a-z]+_/.test(afterUpload) || afterUpload.startsWith("t_")) {
    return url;
  }
  return url.replace("/upload/", `/upload/${transform}/`);
}

// Common presets, sized for their surface.
export const CLD_CARD = "w_640,h_427,c_fill,f_auto,q_auto";
export const CLD_COVER = "w_1600,h_900,c_fill,f_auto,q_auto";
export const CLD_AVATAR = "w_256,h_256,c_fill,f_auto,q_auto";
export const CLD_THUMB = "w_120,h_120,c_fill,f_auto,q_auto";
