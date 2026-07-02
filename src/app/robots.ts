import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/branding";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/supplier/", "/api/", "/start", "/dashboard/"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
