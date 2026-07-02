import type { Metadata } from "next";
import { Category } from "@prisma/client";
import { searchSuppliers } from "@/lib/searchSuppliers";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "חיפוש ספקי אירועים",
  description:
    "גלו ספקים מאומתים לאירוע שלכם לפי תאריך, אזור וקטגוריה — עם בדיקת זמינות בזמן אמת.",
  alternates: { canonical: "/search" },
};

interface PageProps {
  searchParams: Promise<{
    areas?: string;
    date?: string;
    category?: string;
    eventType?: string;
    page?: string;
  }>;
}

function normalizeSupplier(s: {
  id: string;
  slug: string;
  name: string;
  category: Category;
  city: string | null;
  basePriceFrom: number | null;
  basePriceTo: number | null;
  ratingAvg: number;
  ratingCount: number;
  isVerified: boolean;
  photos: Array<{ cloudinaryUrl: string; type: string; sortOrder: number }>;
}) {
  const profilePhoto =
    s.photos.find((p) => p.type === "PROFILE")?.cloudinaryUrl ??
    s.photos.find((p) => p.type === "PORTFOLIO")?.cloudinaryUrl ??
    "/placeholder-supplier.svg";
  const coverPhoto =
    s.photos.find((p) => p.type === "COVER")?.cloudinaryUrl ?? profilePhoto;
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    city: s.city ?? "",
    profilePhoto,
    coverPhoto,
    rating: s.ratingAvg ?? 0,
    ratingCount: s.ratingCount ?? 0,
    priceFrom: s.basePriceFrom ?? 0,
    priceTo: s.basePriceTo ?? undefined,
    category: s.category,
    isSaved: false,
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const areas = params.areas ? params.areas.split(",").filter(Boolean) : undefined;
  const category =
    params.category && Object.values(Category).includes(params.category as Category)
      ? (params.category as Category)
      : undefined;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const data = await searchSuppliers({
    areas,
    date: params.date,
    category,
    eventType: params.eventType,
    page,
  });

  const initialData = {
    suppliers: data.suppliers.map(normalizeSupplier),
    total: data.pagination.total,
    page: data.pagination.page,
    totalPages: data.pagination.totalPages,
    areaFallback: data.areaFallback,
  };

  return <SearchClient initialData={initialData} />;
}
