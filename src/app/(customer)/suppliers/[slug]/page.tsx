import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { normalizeSupplier } from "@/lib/supplier";
import { APP_URL, BRAND_NAME, OG_IMAGE_PATH } from "@/lib/branding";
import { CATEGORY_LABELS_SINGULAR } from "@/lib/categories";
import SupplierProfileClient from "./SupplierProfileClient";

// On-demand SSR with ISR — first hit renders + caches, subsequent hits within
// 300s are served from the edge. Skipping generateStaticParams to avoid
// exhausting the Supabase pooler (15 conns) during build.
export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ plan?: string; cat?: string }>;
}

const SUPPLIER_SELECT = {
  id: true,
  slug: true,
  name: true,
  category: true,
  bioHe: true,
  city: true,
  phone: true,
  serviceAreas: true,
  supportedEventTypes: true,
  basePriceFrom: true,
  basePriceTo: true,
  ratingAvg: true,
  ratingCount: true,
  isVerified: true,
  responseRate: true,
  highlights: true,
  createdAt: true,
  photos: { orderBy: { sortOrder: "asc" as const } },
  packages: { orderBy: { price: "asc" as const } },
  reviews: {
    where: { isVisible: true },
    orderBy: { createdAt: "desc" as const },
    take: 10,
    include: { customer: { select: { name: true } } },
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const raw = await prisma.supplier.findUnique({
    where: { slug },
    select: {
      name: true,
      bioHe: true,
      city: true,
      category: true,
      photos: {
        where: { type: { in: ["COVER", "PROFILE"] } },
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { cloudinaryUrl: true },
      },
    },
  });

  if (!raw) return { title: "ספק לא נמצא" };

  const category = CATEGORY_LABELS_SINGULAR[raw.category] ?? raw.category;
  const title = `${raw.name} — ${category}${raw.city ? ` · ${raw.city}` : ""}`;
  const description =
    raw.bioHe?.slice(0, 155) ||
    `${raw.name}, ${category}${raw.city ? ` ב-${raw.city}` : ""}. בדקו זמינות וקבעו פגישה ב-${BRAND_NAME}.`;
  const ogImage = raw.photos[0]?.cloudinaryUrl ?? OG_IMAGE_PATH;
  const url = `${APP_URL}/suppliers/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: `/suppliers/${slug}` },
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      locale: "he_IL",
      images: [{ url: ogImage, width: 1200, height: 630, alt: raw.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function SupplierProfilePage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { plan, cat } = await searchParams;

  const raw = await prisma.supplier.findUnique({
    where: { slug },
    select: SUPPLIER_SELECT,
  });

  if (!raw) notFound();

  const supplier = normalizeSupplier(raw);

  // Plan-aware: only when arriving from a plan step with a matching category.
  const planMode = Boolean(plan) && cat === raw.category;
  const planPackages = raw.packages.map((p) => ({
    id: p.id,
    nameHe: p.nameHe,
    descHe: p.descHe,
    price: p.price,
    hours: p.hours,
    includes: p.includes,
    isPopular: p.isPopular,
  }));

  const categoryLabel = CATEGORY_LABELS_SINGULAR[raw.category] ?? raw.category;
  const coverPhoto = supplier.coverPhoto;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: raw.name,
    description: raw.bioHe || `${raw.name} — ${categoryLabel}`,
    image: coverPhoto?.startsWith("http") ? coverPhoto : `${APP_URL}${OG_IMAGE_PATH}`,
    url: `${APP_URL}/suppliers/${slug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: raw.city || undefined,
      addressCountry: "IL",
    },
    ...(raw.basePriceFrom
      ? { priceRange: `₪${raw.basePriceFrom}+` }
      : {}),
    ...(raw.ratingCount && raw.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: raw.ratingAvg,
            reviewCount: raw.ratingCount,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SupplierProfileClient
        supplier={supplier}
        planMode={planMode && Boolean(plan)}
        planEventId={plan}
        planPackages={planPackages}
      />
    </>
  );
}
