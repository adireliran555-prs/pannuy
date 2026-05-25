"use client";

import Link from "next/link";
import { useSuppliers, NormalizedSupplier } from "@/hooks/useSuppliers";
import SupplierCard from "./SupplierCard";
import { SupplierCardSkeleton } from "@/components/ui/Skeleton";
import { ArrowLeft } from "lucide-react";

interface SimilarSuppliersProps {
  currentSupplierId: string;
  category: string;
}

export default function SimilarSuppliers({ currentSupplierId, category }: SimilarSuppliersProps) {
  const { suppliers, isLoading } = useSuppliers({ category, limit: 7 });

  const similar = (suppliers as NormalizedSupplier[]).filter((s) => s.id !== currentSupplierId).slice(0, 3);

  if (!isLoading && similar.length === 0) return null;

  return (
    <section className="py-12 px-4 sm:px-6 bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">אולי יעניין אתכם גם</p>
            <h2 className="text-xl font-black text-text-main">ספקים דומים</h2>
          </div>
          <Link
            href="/search"
            className="text-sm font-semibold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
          >
            ראו הכל
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {isLoading
            ? [1, 2, 3].map((i) => <SupplierCardSkeleton key={i} />)
            : similar.map((s) => (
                <SupplierCard
                  key={s.id}
                  id={s.id}
                  slug={s.slug}
                  name={s.name}
                  city={s.city}
                  profilePhoto={s.profilePhoto}
                  coverPhoto={s.coverPhoto}
                  rating={s.rating}
                  ratingCount={s.ratingCount}
                  priceFrom={s.priceFrom}
                  priceTo={s.priceTo}
                  category={s.category}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
