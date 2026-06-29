"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Share2,
  Heart,
  CheckCircle,
  ChevronRight,
  Phone,
  Check,
  Sparkles,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PhotoGallery from "@/components/common/PhotoGallery";
import PackageCard from "@/components/common/PackageCard";
import AvailabilityCalendar from "@/components/common/AvailabilityCalendar";
import SimilarSuppliers from "@/components/common/SimilarSuppliers";
import { formatPrice, cn } from "@/lib/utils";
import { CATEGORY_LABELS_SINGULAR } from "@/lib/categories";
import { getEventTypeLabel } from "@/lib/event-types";
import { BRAND_NAME } from "@/lib/branding";
import type { NormalizedSupplier } from "@/lib/supplier";
import { pushRecentlyViewed } from "@/lib/recently-viewed";
import { EVENT_CONTEXT_CHANGED, getEventContext } from "@/lib/event-context";
import { withReturnTo } from "@/lib/return-to";

const MARKET_PRICE_RANGES: Record<string, { min: number; max: number; avg: number }> = {
  PHOTOGRAPHER: { min: 3000, max: 15000, avg: 8500 },
  VIDEOGRAPHER: { min: 4000, max: 18000, avg: 9000 },
  BRIDAL_SUITE: { min: 800, max: 5000, avg: 2500 },
  DJ: { min: 2500, max: 8000, avg: 4500 },
  FLORIST: { min: 3000, max: 20000, avg: 9000 },
  CATERING: { min: 150, max: 500, avg: 280 },
};

export default function SupplierProfileClient({ supplier }: { supplier: NormalizedSupplier }) {
  const router = useRouter();
  const [bioExpanded, setBioExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [dateAvailability, setDateAvailability] = useState<boolean | null>(null);
  const [eventDate, setEventDate] = useState<string | null>(null);

  const refreshEventDate = () => {
    setEventDate(getEventContext()?.date || null);
  };

  useEffect(() => {
    refreshEventDate();
    const onCtx = () => refreshEventDate();
    window.addEventListener(EVENT_CONTEXT_CHANGED, onCtx);
    return () => window.removeEventListener(EVENT_CONTEXT_CHANGED, onCtx);
  }, []);

  useEffect(() => {
    if (!eventDate) {
      setDateAvailability(null);
      return;
    }
    const [y, m] = eventDate.split("-").map(Number);
    fetch(`/api/suppliers/${supplier.slug}/availability?year=${y}&month=${m}`)
      .then((r) => r.json())
      .then((json) => {
        const day = (json.data ?? []).find(
          (d: { date: string }) => d.date === eventDate
        );
        if (!day) {
          setDateAvailability(null);
          return;
        }
        const hasOpen = (day.slots ?? []).some(
          (s: { available: boolean }) => s.available
        );
        setDateAvailability(hasOpen);
      })
      .catch(() => setDateAvailability(null));
  }, [eventDate, supplier.slug]);

  // Track recently viewed + record a profile view (best-effort, deduped per session per supplier)
  useEffect(() => {
    pushRecentlyViewed({ slug: supplier.slug, name: supplier.name });

    const SESSION_KEY = "pannuy_viewed_suppliers_session";
    const viewed: string[] = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "[]");
    if (!viewed.includes(supplier.id)) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify([...viewed, supplier.id]));
      fetch("/api/profile-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId: supplier.id, source: "profile" }),
        keepalive: true,
      }).catch(() => {});
    }
  }, [supplier.id, supplier.slug]);

  // Show sticky bar after scrolling past hero
  useEffect(() => {
    const onScroll = () => setShowStickyBar(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reflect persisted saved state (best-effort; ignore if unauthenticated)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/saved")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !json?.data) return;
        const found = (json.data as { supplierId: string }[]).some(
          (s) => s.supplierId === supplier.id
        );
        if (found) setIsSaved(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [supplier.id]);

  // Persist save toggle; route unauthenticated users to /start
  const handleToggleSave = async () => {
    if (savePending) return;
    setSavePending(true);
    const next = !isSaved;
    setIsSaved(next); // optimistic
    try {
      const res = next
        ? await fetch("/api/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ supplierId: supplier.id }),
          })
        : await fetch(`/api/saved/${supplier.id}`, { method: "DELETE" });

      if (res.status === 401) {
        setIsSaved(!next); // revert
        router.push("/start");
        return;
      }
      if (!res.ok) setIsSaved(!next); // revert on failure
    } catch {
      setIsSaved(!next); // revert
    } finally {
      setSavePending(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `בדקו את ${supplier.name} ב-${BRAND_NAME} 💍`;
    if (navigator.share) {
      await navigator.share({ title: supplier.name, text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    // Record this as a referral (lead) so we can follow it up — fire-and-forget
    // so it never blocks opening WhatsApp.
    fetch("/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId: supplier.id, channel: "WHATSAPP" }),
      keepalive: true,
    }).catch(() => {});
    const msg = encodeURIComponent(`היי ${supplier.name}, ראיתי את הפרופיל שלך ב-${BRAND_NAME} ואשמח לשמוע פרטים 🎉`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const bioShort = supplier.bio.length > 200 && !bioExpanded;
  const categoryLabel = CATEGORY_LABELS_SINGULAR[supplier.category] ?? supplier.category;

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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={supplier.profilePhoto} alt={supplier.name} className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-text-main text-sm truncate">{supplier.name}</span>
          </div>
          <Button size="sm" onClick={() => router.push(withReturnTo(`/book/${supplier.id}`, `/suppliers/${supplier.slug}`))}>קבעו פגישה</Button>
        </div>
      </div>

      {/* ── Cover photo ── */}
      <div className="relative h-64 sm:h-96 w-full overflow-hidden bg-gradient-to-br from-rose-100 to-amber-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={supplier.coverPhoto}
          alt={`${supplier.name} - תמונת כיסוי`}
          className="w-full h-full object-cover"

        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-text-main hover:bg-white transition-colors shadow-md"
        >
          <ChevronRight className="h-5 w-5" />
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
            onClick={handleToggleSave}
            disabled={savePending}
            title={isSaved ? "הסירו מהשמורים" : "שמרו"}
            className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md transition-all hover:scale-110 disabled:opacity-60"
          >
            <Heart className={`h-5 w-5 transition-all ${isSaved ? "fill-red-500 stroke-red-500" : "stroke-gray-600"}`} />
          </button>
        </div>
      </div>

      {/* ── Profile header ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-16 flex items-end gap-5 pb-4">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-xl flex-shrink-0 bg-primary-light">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={supplier.profilePhoto} alt={supplier.name} className="w-full h-full object-cover" />
          </div>
          <div className="pb-2 flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]">{supplier.name}</h1>
          </div>
        </div>

        {/* Info row */}
        <div className="flex flex-wrap items-center gap-3 pb-5 border-b border-border">
          <Badge variant="primary">{categoryLabel}</Badge>
          {(supplier.supportedEventTypes ?? []).map((eventTypeId: string) => (
            <Badge key={eventTypeId} variant="default">
              {getEventTypeLabel(eventTypeId)}
            </Badge>
          ))}
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
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap gap-3 py-3 border-b border-border">
          {supplier.isVerified && (
            <span className="text-xs font-semibold text-green-700 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              ספק מאומת
            </span>
          )}
          <span className="text-xs font-semibold text-primary flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            מהטופ של ישראל
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
                    {bioExpanded ? "הצג פחות" : "קראו עוד"}
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
                    onSelect={() => router.push(withReturnTo(`/book/${supplier.id}`, `/suppliers/${supplier.slug}`))}
                  />
                ))}
              </div>
            </section>

            {/* Why choose this supplier — admin-curated highlights */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-black text-text-main">למה לבחור בספק הזה</h2>
              </div>
              <div className="bg-white rounded-2xl border border-border p-6">
                {supplier.highlights && supplier.highlights.length > 0 ? (
                  <ul className="space-y-3">
                    {(supplier.highlights as string[]).map((highlight, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-light text-primary flex items-center justify-center mt-0.5">
                          <Check className="h-4 w-4" />
                        </span>
                        <span className="text-text-main leading-relaxed">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-text-muted leading-relaxed">
                    ספק נבחר ומאומת בקטגוריה.
                  </p>
                )}
              </div>
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={supplier.profilePhoto} alt={supplier.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-text-main">{supplier.name}</h3>
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

              {/* Availability indicator */}
              {eventDate && dateAvailability !== null && (
                <div
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${
                    dateAvailability ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  {dateAvailability
                    ? "פנוי לתאריך שלכם ✓"
                    : "לא פנוי לתאריך שלכם"}
                </div>
              )}
              {!eventDate && (
                <p className="text-xs text-text-muted text-center bg-surface rounded-xl px-3 py-2">
                  בחרו תאריך אירוע בסרגל למעלה כדי לראות זמינות
                </p>
              )}

              {/* CTA */}
              <Button
                size="lg"
                fullWidth
                onClick={() =>
                  router.push(withReturnTo(`/book/${supplier.id}`, `/suppliers/${supplier.slug}`))
                }
              >
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
                onClick={handleToggleSave}
                disabled={savePending}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-full border-2 font-semibold text-sm transition-all disabled:opacity-60 ${
                  isSaved
                    ? "border-red-300 text-red-500 bg-red-50"
                    : "border-border text-text-muted hover:border-primary hover:text-primary"
                }`}
              >
                <Heart className={`h-4 w-4 ${isSaved ? "fill-red-500 stroke-red-500" : ""}`} />
                {isSaved ? "שמור ❤" : "שמרו"}
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
        <Button
          size="lg"
          fullWidth
          onClick={() =>
            router.push(withReturnTo(`/book/${supplier.id}`, `/suppliers/${supplier.slug}`))
          }
        >
          קבעו פגישה · {formatPrice(supplier.priceFrom)}+
        </Button>
      </div>
    </div>
  );
}
