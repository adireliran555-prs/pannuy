import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { normalizeSupplier } from "@/lib/supplier";
import SupplierProfileClient from "./SupplierProfileClient";

// On-demand SSR with ISR — first hit renders + caches, subsequent hits within
// 300s are served from the edge. Skipping generateStaticParams to avoid
// exhausting the Supabase pooler (15 conns) during build.
export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SupplierProfilePage({ params }: PageProps) {
  const { slug } = await params;

  const raw = await prisma.supplier.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      bioHe: true,
      city: true,
      serviceAreas: true,
      basePriceFrom: true,
      basePriceTo: true,
      ratingAvg: true,
      ratingCount: true,
      isVerified: true,
      responseRate: true,
      highlights: true,
      createdAt: true,
      photos: { orderBy: { sortOrder: "asc" } },
      packages: { orderBy: { price: "asc" } },
      reviews: {
        where: { isVisible: true },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { customer: { select: { name: true } } },
      },
    },
  });

  if (!raw) notFound();

  const supplier = normalizeSupplier(raw);
  return <SupplierProfileClient supplier={supplier} />;
}
