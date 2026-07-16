import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { APP_URL } from "@/lib/branding";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/search",
    "/for-suppliers",
    "/terms",
    "/privacy",
    "/accessibility",
    "/contact",
  ].map((path) => ({
    url: `${APP_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  let supplierRoutes: MetadataRoute.Sitemap = [];
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
    supplierRoutes = suppliers.map((s) => ({
      url: `${APP_URL}/suppliers/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    // If the DB is unreachable at build time, still return static routes.
  }

  return [...staticRoutes, ...supplierRoutes];
}
