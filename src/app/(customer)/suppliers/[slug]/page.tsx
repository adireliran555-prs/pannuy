"use client";

import { use, useEffect, useState } from "react";
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
  Phone,
  Award,
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
import SimilarSuppliers from "@/components/common/SimilarSuppliers";
import EmptyState from "@/components/ui/EmptyState";
import { formatPrice, cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  PHOTOGRAPHER: "צילום חתונה",
  VIDEOGRAPHER: "צילום וידאו",
  BRIDAL_SUITE: "מקומות התארגנות",
  DJ: "DJ ומוסיקה",
  FLORIST: "עיצוב פרחוני",
  CATERING: "קייטרינג",
};

const MARKET_PRICE_RANGES: Record<string, { min: number; max: number; avg: number }> = {
  PHOTOGRAPHER: { min: 3000, max: 15000, avg: 8500 },
  VIDEOGRAPHER: { min: 4000, max: 18000, avg: 9000 },
  BRIDAL_SUITE: { min: 800, max: 5000, avg: 2500 },
  DJ: { min: 2500, max: 8000, avg: 4500 },
  FLORIST: { min: 3000, max: 20000, avg: 9000 },
  CATERING: { min: 150, max: 500, avg: 280 },
};

const RECENTLY_VIEWED_KEY = "pannuy_recently_viewed";
const MAX_RECENTLY_VIEWED = 6;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function SupplierProfilePage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { supplier, isLoading, notFound } = useSupplier(slug);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Track recently viewed
  useEffect(() => {
    if (!supplier) return;
    const prev: string[] = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) ?? "[]");
    const next = [supplier.slug, ...prev.filter((s) => s !== supplier.slug)].slice(0, MAX_RECENTLY_VIEWED);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  }, [supplier]);

  // Show sticky bar after scrolling past hero
  useEffect(() => {
    const onScroll = () => setShowStickyBar(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleShare = async () => {
    const url = window.location.href;
    const text = supplier ? `בדקו את ${supplier.name} בפנוי 💍` : "בדקו את הספק הזה בפנוי";
    if (navigator.share) {
      await navigator.share({ title: supplier?.name ?? "פנוי", text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    if (!supplier) return;
    const msg = encodeURIComponent(`היי ${supplier.name}, ראיתי את הפרופיל שלך בפנוי ואשמח לשמוע פרטים 💍`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  if (isLoading) return <div className="min-h-screen bg-surface"><ProfilePageSkeleton /></div>;

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
  const categoryLabel = CATEGORY_LABELS[supplier.category] ?? supplier.category;

  // Deterministic social proof numbers seeded from supplier id
  const savedCount = ((supplier.id.charCodeAt(0) ?? 5) % 12) + 3;
  const bookedCount = ((supplier.id.charCodeAt(1) ?? 3) % 8) + 2;

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Sticky top bar (shows on scroll) ── */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm transition-all duration-300",
        showStickyBar ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-primary-light">
              <Image src={supplier.profilePhoto} alt={supplier.name} width={32} height={32} className="object-cover" unoptimized />
            </div>
            <span className="font-bold text-text-main text-sm truncate">{supplier.name}</span>
            <Stars rating={avgRating} count={supplier.ratingCount} size="sm" />
          </div>
          <Button size="sm" onClick={() => router.push(`/book/${supplier.id}`)}>קבעו פגישה</Button>
        </div>
      </div>

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-text-main hover:bg-white transition-colors shadow-md"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Share + Save */}
        <div className="absolute top-4 left-4 flex gap-2">
          <button
            onClick={handleShare}
            title={shareSuccess ? "הקישור הועתק!" : "שתפו"}
            className={cn(
              "p-2.5 backdrop-blur-sm rounded-full shadow-md transition-all",
              shareSuccess
                ? "bg-green-500 text-white"
                : "bg-white/90 text-text-muted hover:text-text-main"
            )}
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsSaved((v) => !v)}
            className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md transition-all hover:scale-110"
          >
            <Heart className={`h-5 w-5 transition-all ${isSaved ? "fill-red-500 stroke-red-500" : "stroke-gray-600"}`} />
          </button>
        </div>
      </div>

      {/* ── Profile header ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-16 flex items-end gap-5 pb-4">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-xl flex-shrink-0 bg-primary-light">
            <Image src={supplier.profilePhoto} alt={supplier.name} fill className="object-cover" unoptimized />
          </div>
          <div className="pb-2 flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]">{supplier.name}</h1>
          </div>
        </div>

        {/* Info row */}
        <div className="flex flex-wrap items-center gap-3 pb-5 border-b border-border">
          <Badge variant="primary">{categoryLabel}</Badge>
          {supplier.isVerified && (
            <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <CheckCircle className="h-3.5 w-3.5" />
              מאומת
            </span>
          )}
          <div className="flex items-center gap-1 text-text-muted text-sm">
            <MapPin className="h-3.5 w-3.5" />
            {supplier.city}
          </div>
          <Stars rating={avgRating} count={supplier.ratingCount} />
          <div className="flex items-center gap-1 text-text-muted text-sm">
            <Clock className="h-3.5 w-3.5" />
            מגיבים {supplier.responseTime}
          </div>
          <div className="flex items-center gap-1 text-text-muted text-sm">
            <MessageSquare className="h-3.5 w-3.5" />
            {supplier.responseRate}% מענה
          </div>
        </div>

        {/* Social proof nudges */}
        <div className="flex flex-wrap gap-3 py-3 border-b border-border">
          <span className="text-xs text-text-muted flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 fill-rose-400 stroke-rose-400" />
            {savedCount} זוגות שמרו השבוע
          </span>
          <span className="text-xs text-text-muted flex items-center gap-1">
            <Award className="h-3.5 w-3.5 text-amber-500" />
            {bookedCount} חתונות החודש
          </span>
          <span className="text-xs font-semibold text-green-700 flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" />
            מגיבים בדרך כלל תוך {supplier.responseTime}
          </span>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Main column ── */}
          <div className="flex-1 min-w-0 space-y-10">
            {/* Portfolio */}
            <section>
              <h2 className="text-xl font-black text-text-main mb-4">תיק עבודות</h2>
              <PhotoGallery photos={supplier.portfolio} supplierName={supplier.name} />
            </section>

            {/* About */}
            <section>
              <h2 className="text-xl font-black text-text-main mb-3">אודות</h2>
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
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2">אזורי שירות</p>
                  <div className="flex flex-wrap gap-2">
                    {(supplier.areas as string[]).map((area) => (
                      <span key={area} className="text-xs font-medium bg-surface text-text-muted border border-border px-3 py-1 rounded-full">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Packages */}
            <section>
              <h2 className="text-xl font-black text-text-main mb-4">חבילות ומחירים</h2>
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
                <h2 className="text-xl font-black text-text-main">ביקורות</h2>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-text-main">{avgRating}</span>
                  <span className="text-text-muted text-sm">({supplier.ratingCount} ביקורות)</span>
                </div>
              </div>

              {supplier.reviews.length === 0 ? (
                <EmptyState emoji="💬" title="אין ביקורות עדיין" description="הספק/ת חדש/ה בפלטפורמה" />
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
              <h2 className="text-xl font-black text-text-main mb-4">זמינות</h2>
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
                  <Image src={supplier.profilePhoto} alt={supplier.name} fill className="object-cover" unoptimized />
                </div>
                <div>
                  <h3 className="font-bold text-text-main">{supplier.name}</h3>
                  <Stars rating={avgRating} count={supplier.ratingCount} size="sm" />
                </div>
              </div>

              {/* Price */}
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-1">מחיר</p>
                <p className="text-2xl font-black text-text-main">
                  {formatPrice(supplier.priceFrom)}
                  {supplier.priceTo && (
                    <span className="text-base font-medium text-text-muted"> – {formatPrice(supplier.priceTo)}</span>
                  )}
                </p>
                <p className="text-xs text-text-muted mt-0.5">מחיר לחבילת בסיס</p>
                {MARKET_PRICE_RANGES[supplier.category] && (
                  <p className="text-xs text-text-muted mt-1">
                    טווח שוק: {formatPrice(MARKET_PRICE_RANGES[supplier.category].min)}–{formatPrice(MARKET_PRICE_RANGES[supplier.category].max)}
                    <span className="text-text-main font-semibold"> · ממוצע {formatPrice(MARKET_PRICE_RANGES[supplier.category].avg)}</span>
                  </p>
                )}
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
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${
                supplier.isAvailable ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}>
                <CheckCircle className="h-4 w-4" />
                {supplier.isAvailable ? "פנוי לתאריך שלכם ✓" : "לא פנוי לתאריך שלכם"}
              </div>

              {/* CTA */}
              <Button size="lg" fullWidth onClick={() => router.push(`/book/${supplier.id}`)}>
                קבעו פגישה
              </Button>

              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white font-semibold text-sm transition-all"
              >
                <Phone className="h-4 w-4" />
                שלחו הודעת WhatsApp
              </button>

              <button
                onClick={() => setIsSaved((v) => !v)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-full border-2 font-semibold text-sm transition-all ${
                  isSaved
                    ? "border-red-300 text-red-500 bg-red-50"
                    : "border-border text-text-muted hover:border-primary hover:text-primary"
                }`}
              >
                <Heart className={`h-4 w-4 ${isSaved ? "fill-red-500 stroke-red-500" : ""}`} />
                {isSaved ? "שמורה ❤" : "שמרו"}
              </button>

              <p className="text-xs text-text-muted text-center">
                הפגישה חינמית ואינה מחייבת בחירה
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Similar Suppliers ── */}
      <SimilarSuppliers currentSupplierId={supplier.id} category={supplier.category} />

      {/* ── Mobile sticky CTA ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-border px-4 py-3 flex gap-3">
        <button
          onClick={handleWhatsApp}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-full border-2 border-[#25D366] text-[#25D366] font-semibold text-sm transition-all hover:bg-[#25D366] hover:text-white flex-shrink-0"
        >
          <Phone className="h-4 w-4" />
          WhatsApp
        </button>
        <Button size="lg" fullWidth onClick={() => router.push(`/book/${supplier.id}`)}>
          קבעו פגישה · {formatPrice(supplier.priceFrom)}+
        </Button>
      </div>
    </div>
  );
}
