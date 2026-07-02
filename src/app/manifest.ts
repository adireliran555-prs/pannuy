import type { MetadataRoute } from "next";
import { BRAND_NAME, BRAND_TAGLINE, LOGO_PATH } from "@/lib/branding";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND_NAME,
    short_name: BRAND_NAME,
    description: BRAND_TAGLINE,
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F5",
    theme_color: "#8F6844",
    lang: "he",
    dir: "rtl",
    icons: [
      { src: LOGO_PATH, sizes: "512x512", type: "image/png" },
    ],
  };
}
