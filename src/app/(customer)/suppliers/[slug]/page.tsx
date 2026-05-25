"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Clock,
  MessageSquare,
  Share2,
  Heart,
  CheckCircle,
  Star,
  ChevronLeft,
} from "lucide-react";
import { useSupplier } from "@/hooks/useSupplier";
import { ProfilePageSkeleton } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Stars from "@/components/ui/Stars";
import PhotoGallery from "@/components/common/PhotoGallery";
import PackageCard from "@/components/common/PackageCard";
import ReviewCard from "@/components/common/ReviewCard";
import AvailabilityCalendar from "@/components/common/AvailabilityCalendar";
import EmptyState from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils";
import { useState } from "react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function SupplierProfilePage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { supplier, isLoading, notFound } = useSupplier(slug);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface">
        <ProfilePageSkeleton />
      </div>
    );
  }

  if (notFound || !supplier) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <EmptyState
          emoji="🔍"
          title="הספק/ת לא נמצאה"
          description="ייתכן שהפרופיל הוסר או שהקישור שגוי"
          ctaLabel="חזרה לחיפוש"
          onCta={() => router.push("/search")}
        />
      </div>
    );
  }

  const avgRating = supplier.rating;
  const bioShort = supplier.bio.length > 200 && !bioExpanded;

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Cover photo ── */}
      <div className="relative h-64 sm:h-96 w-full overflow-hidden bg-gradient-to-br from-rose-100 to-amber-100">
        <Image
          src={supplier.coverPhoto}
          alt={`${supplier.name} - תמונת כיסוי`}
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-text-main hover:bg-white transition-colors shadow-md"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Share + Save */}
        <div className="absolute top-4 left-4 flex gap-2">
          <button className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-text-muted hover:text-text-main transition-colors shadow-md">
            <Share2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsSaved((v) => !v)}
            className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md transition-all hover:scale-110"
          >
            <Heart
              className={`h-5 w-5 transition-all ${
                isSaved ? "fill-red-500 stroke-red-500" : "stroke-gray-600"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Profile header ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-16 flex items-end gap-5 pb-4">
          {/* Profile photo */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-xl flex-shrink-0 bg-primary-light">
            <Image
              src={supplier.profilePhoto}
              alt={supplier.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="pb-2 flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg">
              {supplier.name}
            </h1>
          </div>
        </div>

        {/* Info row */}
        <div className="flex flex-wrap items-center gap-3 pb-5 border-b border-border">
          <Badge variant="primary">{supplier.category}</Badge>
          <div className="flex items-center gap-1 text-text-muted text-sm">
            <MapPin className="h-3.5 w-3.5" />
            {supplier.city}
          </div>
          <Stars rating={avgRating} count={supplier.ratingCount} />
          <div className="flex items-center gap-1 text-text-muted text-sm">
            <Clock className="h-3.5 w-3.5" />
            מגיב {supplier.responseTime}
          </div>
          <div className="flex items-center gap-1 text-text-muted text-sm">
            <MessageSquare className="h-3.5 w-3.5" />
            {supplier.responseRate}% אחוז מענה
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Main column ── */}
          <div className="flex-1 min-w-0 space-y-10">
            {/* Portfolio */}
            <section>
              <h2 className="text-xl font-black text-text-main mb-4">
                תיק עבודות
              </h2>
              <PhotoGallery
                photos={supplier.portfolio}
                supplierName={supplier.name}
              />
            </section>

            {/* About */}
            <section>
              <h2 className="text-xl font-black text-text-main mb-3">
                אודות
              </h2>
              <div className="bg-white rounded-2xl border border-border p-6">
                <p className="text-text-muted leading-relaxed">
                  {bioShort ? supplier.bio.slice(0, 200) + "..." : supplier.bio}
                </p>
                {supplier.bio.length > 200 && (
                  <button
                    onClick={() => setBioExpanded((v) => !v)}
                    className="mt-2 text-primary font-semibold text-sm hover:text-primary-dark"
                  >
                    {bioExpanded ? "הצג פחות" : "קרא עוד"}
                  </button>
                )}

                {/* Areas */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2">
                    אזורי שירות
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(supplier.areas as string[]).map((area) => (
                      <span
                        key={area}
                        className="text-xs font-medium bg-surface text-text-muted border border-border px-3 py-1 rounded-full"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Packages */}
            <section>
              <h2 className="text-xl font-black text-text-main mb-4">
                חבילות ומחירים
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {supplier.packages.map((pkg: any) => (
                  <PackageCard
                    key={pkg.id}
                    name={pkg.name}
                    price={pkg.price}
                    hours={pkg.hours}
                    includes={pkg.includes}
                    isPopular={pkg.isPopular}
                    onSelect={() => router.push(`/book/${supplier.id}`)}
                  />
                ))}
              </div>
            </section>

            {/* Reviews */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-text-main">
                  ביקורות
                </h2>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-text-main">{avgRating}</span>
                  <span className="text-text-muted text-sm">
                    ({supplier.ratingCount} ביקורות)
                  </span>
                </div>
              </div>

              {supplier.reviews.length === 0 ? (
                <EmptyState
                  emoji="💬"
                  title="אין ביקורות עדיין"
                  description="הספק/ת חדש/ה בפלטפורמה"
                />
              ) : (
                <div className="space-y-4">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {supplier.reviews.map((review: any) => (
                    <ReviewCard
                      key={review.id}
                      reviewerName={review.reviewerName}
                      date={review.date}
                      rating={review.rating}
                      text={review.text}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Availability */}
            <section>
              <h2 className="text-xl font-black text-text-main mb-4">
                זמינות
              </h2>
              <div className="bg-white rounded-2xl border border-border p-6">
                <AvailabilityCalendar supplierId={supplier.id} />
                <p className="mt-4 text-xs text-text-muted text-center">
                  פגישה כוללת 60 דקות · וידאו, טלפון, או פנים אל פנים
                </p>
              </div>
            </section>
          </div>

          {/* ── Sticky sidebar ── */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-border p-6 sticky top-24 shadow-md space-y-5">
              {/* Supplier summary */}
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-primary-light flex-shrink-0">
                  <Image
                    src={supplier.profilePhoto}
                    alt={supplier.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <h3 className="font-bold text-text-main">{supplier.name}</h3>
                  <Stars rating={avgRating} count={supplier.ratingCount} size="sm" />
                </div>
              </div>

              {/* Price */}
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-1">
                  מחיר
                </p>
                <p className="text-2xl font-black text-text-main">
                  {formatPrice(supplier.priceFrom)}
                  {supplier.priceTo && (
                    <span className="text-base font-medium text-text-muted">
                      {" "}– {formatPrice(supplier.priceTo)}
                    </span>
                  )}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  מחיר לחבילת בסיס
                </p>
              </div>

              {/* Response stats */}
              <div className="flex gap-4 text-sm">
                <div className="flex-1 text-center p-3 bg-surface rounded-xl">
                  <p className="font-black text-text-main">{supplier.responseTime}</p>
                  <p className="text-text-muted text-xs mt-0.5">זמן תגובה</p>
                </div>
                <div className="flex-1 text-center p-3 bg-surface rounded-xl">
                  <p className="font-black text-text-main">{supplier.responseRate}%</p>
                  <p className="text-text-muted text-xs mt-0.5">מענה</p>
                </div>
              </div>

              {/* Availability indicator */}
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${
                  supplier.isAvailable
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                {supplier.isAvailable
                  ? "פנוי לתאריך שלכם ✓"
                  : "לא פנוי לתאריך שלכם"}
              </div>

              {/* CTA */}
              <Button
                size="lg"
                fullWidth
                onClick={() => router.push(`/book/${supplier.id}`)}
              >
                קבעו פגישה
              </Button>

              <button
                onClick={() => setIsSaved((v) => !v)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-full border-2 font-semibold text-sm transition-all ${
                  isSaved
                    ? "border-red-300 text-red-500 bg-red-50"
                    : "border-border text-text-muted hover:border-primary hover:text-primary"
                }`}
              >
                <Heart
                  className={`h-4 w-4 ${isSaved ? "fill-red-500 stroke-red-500" : ""}`}
                />
                {isSaved ? "שמורה ❤" : "שמרי"}
              </button>

              <p className="text-xs text-text-muted text-center">
                הפגישה חינמית ואינה מחייבת בחירה
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
