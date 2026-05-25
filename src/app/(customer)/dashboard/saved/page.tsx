"use client";

import Link from "next/link";
import DashboardLayout from "@/components/common/DashboardLayout";
import SupplierCard from "@/components/common/SupplierCard";
import { SupplierCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { useSaved } from "@/hooks/useSaved";
import { useRouter } from "next/navigation";

export default function SavedPage() {
  const { saved, isLoading, mutate } = useSaved();
  const router = useRouter();

  const handleUnsave = (id: string, newSaved: boolean) => {
    if (!newSaved) {
      // Optimistically remove
      mutate();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-text-main">
              הספקים השמורים שלי ❤
            </h1>
            {!isLoading && saved.length > 0 && (
              <p className="text-text-muted text-sm mt-1">
                {saved.length} ספקים שמורים
              </p>
            )}
          </div>
          {!isLoading && saved.length > 0 && (
            <Link href="/search">
              <Button variant="secondary" size="sm">
                גלי עוד
              </Button>
            </Link>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <SupplierCardSkeleton key={i} />
            ))}
          </div>
        ) : saved.length === 0 ? (
          <EmptyState
            emoji="🤍"
            title="עדיין לא שמרת ספקים"
            description="לחצי על הלב בכרטיס הספק כדי לשמור אותה לטובת עתיד"
            ctaLabel="גלי ספקים"
            onCta={() => router.push("/search")}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {saved.map((supplier: any) => (
              <SupplierCard
                key={supplier.id}
                id={supplier.id}
                slug={supplier.slug}
                name={supplier.name}
                city={supplier.city}
                profilePhoto={supplier.profilePhoto}
                coverPhoto={supplier.coverPhoto}
                rating={supplier.rating}
                ratingCount={supplier.ratingCount}
                priceFrom={supplier.priceFrom}
                priceTo={supplier.priceTo}
                category={supplier.category}
                isAvailable={supplier.isAvailable}
                isSaved={true}
                onSave={handleUnsave}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
