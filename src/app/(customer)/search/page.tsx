"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown, Star, Check } from "lucide-react";
import { useSuppliers, NormalizedSupplier } from "@/hooks/useSuppliers";
import SupplierCard from "@/components/common/SupplierCard";
import { SupplierCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const REGIONS = [
  { id: "מרכז", label: "מרכז", emoji: "🏙️" },
  { id: "תל אביב", label: "תל אביב", emoji: "🌆" },
  { id: "ירושלים", label: "ירושלים", emoji: "🕌" },
  { id: "הצפון", label: "צפון", emoji: "🌿" },
  { id: "הדרום", label: "דרום", emoji: "🌵" },
  { id: "השרון", label: "השרון", emoji: "🌊" },
];

const RECENTLY_VIEWED_KEY = "pannuy_recently_viewed";

interface Filters {
  date: string;
  priceMax: number;
  ratingMin: number;
  sortBy: "relevance" | "rating" | "priceAsc" | "priceDesc";
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const areasParam = searchParams.get("areas") || "";
  const initialAreas = areasParam ? areasParam.split(",").filter(Boolean) : [];

  const [filters, setFilters] = useState<Filters>({
    date: searchParams.get("date") || "",
    priceMax: 0,
    ratingMin: 0,
    sortBy: "relevance",
  });
  const [selectedAreas, setSelectedAreas] = useState<string[]>(initialAreas);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const stored: string[] = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) ?? "[]");
    setRecentlyViewed(stored);
  }, []);

  const filterBarRef = useRef<HTMLDivElement>(null);

  const closeAllDropdowns = () => {
    setShowAreaDropdown(false);
    setShowPriceDropdown(false);
    setShowRatingDropdown(false);
    setShowSortDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        closeAllDropdowns();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { suppliers, total, totalPages, areaFallback, isLoading } = useSuppliers({
    areas: selectedAreas.length > 0 ? selectedAreas : undefined,
    date: filters.date || undefined,
    priceMax: filters.priceMax || undefined,
    ratingMin: filters.ratingMin || undefined,
    page,
  });

  const activeFilterCount = [
    selectedAreas.length > 0,
    !!filters.date,
    filters.priceMax > 0,
    filters.ratingMin > 0,
  ].filter(Boolean).length;

  const clearFilter = (key: keyof Filters) => {
    const defaults: Record<keyof Filters, string | number> = { date: "", priceMax: 0, ratingMin: 0, sortBy: "relevance" };
    setFilters((f) => ({ ...f, [key]: defaults[key] }));
  };

  const SORT_LABELS: Record<Filters["sortBy"], string> = {
    relevance: "רלוונטיות",
    rating: "דירוג גבוה",
    priceAsc: "מחיר עולה",
    priceDesc: "מחיר יורד",
  };

  const locationLabel = selectedAreas.length > 0 ? `ב${selectedAreas.join(", ")}` : "בכל הארץ";
  const locationDisplay = selectedAreas.length > 0 ? selectedAreas.join(", ") : "";

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Category pills ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-0 flex items-center gap-3 overflow-x-auto">
          {[
            { id: "PHOTOGRAPHER", label: "צלמות חתונה", emoji: "📸", active: true },
            { id: "VIDEOGRAPHER", label: "צלמי וידאו", emoji: "🎬", active: false },
            { id: "BRIDAL_SUITE", label: "מקומות התארגנות", emoji: "🏛️", active: false },
            { id: "DJ", label: "DJ ומוסיקה", emoji: "🎧", active: false },
            { id: "FLORIST", label: "עיצוב פרחוני", emoji: "💐", active: false },
            { id: "CATERING", label: "קייטרינג", emoji: "🍽️", active: false },
          ].map(({ id, label, emoji, active }) => (
            <button
              key={id}
              disabled={!active}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-sm font-semibold whitespace-nowrap mb-3 transition-colors",
                active
                  ? "border-primary bg-primary text-white"
                  : "border-border text-text-muted cursor-not-allowed opacity-60"
              )}
            >
              <span>{emoji}</span>
              {label}
              {!active && (
                <span className="text-[10px] font-bold bg-gray-700 text-white px-1.5 py-0.5 rounded-full">
                  בקרוב
                </span>
              )}
            </button>
          ))}
        </div>

      {/* ── Filter chips ── */}
        <div ref={filterBarRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-3">

          {/* Mobile row: filter button + active chips (scrollable) */}
          <div className="sm:hidden flex items-center gap-3 overflow-x-auto pb-1">
            <button
              onClick={() => setShowFilterDrawer(true)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-border text-sm font-semibold text-text-main whitespace-nowrap hover:border-primary transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              פילטרים
              {activeFilterCount > 0 && (
                <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {selectedAreas.map((area) => (
              <button
                key={area}
                onClick={() => setSelectedAreas((prev) => prev.filter((a) => a !== area))}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-full text-xs font-semibold whitespace-nowrap"
              >
                {area}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>

          {/* Desktop filters — no overflow so dropdowns can extend below */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Area (region pills) */}
            <div className="relative">
              <button
                onClick={() => { closeAllDropdowns(); setShowAreaDropdown((v) => !v); }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-semibold transition-colors whitespace-nowrap max-w-[220px]",
                  locationDisplay
                    ? "border-primary bg-primary text-white"
                    : "border-border text-text-main hover:border-primary"
                )}
              >
                <span className="truncate">{locationDisplay || "כל האזורים"}</span>
                {locationDisplay ? (
                  <X
                    className="h-3.5 w-3.5 flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); setSelectedAreas([]); }}
                  />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                )}
              </button>
              {showAreaDropdown && (
                <div className="absolute top-full mt-1 z-50 bg-white border border-border rounded-2xl shadow-xl p-3 min-w-[260px]">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2">בחרו אזורים</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {REGIONS.map(({ id, label, emoji }) => {
                      const selected = selectedAreas.includes(id);
                      return (
                        <button
                          key={id}
                          onClick={() => setSelectedAreas((prev) =>
                            prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
                          )}
                          className={cn(
                            "relative flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl border-2 text-xs font-semibold transition-all",
                            selected
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-white text-text-main hover:border-primary/50"
                          )}
                        >
                          {selected && (
                            <span className="absolute top-1 left-1 w-3.5 h-3.5 bg-white/30 rounded-full flex items-center justify-center">
                              <Check className="h-2 w-2 text-white" />
                            </span>
                          )}
                          <span>{emoji}</span>
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedAreas.length > 0 && (
                    <button
                      onClick={() => { setSelectedAreas([]); setShowAreaDropdown(false); }}
                      className="mt-2 w-full text-xs text-text-muted hover:text-primary transition-colors text-center"
                    >
                      נקה בחירה
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Date */}
            <div className="relative">
              <label className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer",
                filters.date
                  ? "border-primary bg-primary text-white"
                  : "border-border text-text-main hover:border-primary"
              )}>
                {filters.date ? `📅 ${new Date(filters.date).toLocaleDateString("he-IL", { day: "numeric", month: "short" })}` : "📅 תאריך החתונה"}
                {filters.date && (
                  <X className="h-3.5 w-3.5" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFilters((f) => ({ ...f, date: "" })); }} />
                )}
                <input
                  type="date"
                  value={filters.date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                />
              </label>
            </div>

            {/* Price */}
            <div className="relative">
              <button
                onClick={() => { closeAllDropdowns(); setShowPriceDropdown((v) => !v); }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-semibold transition-colors whitespace-nowrap",
                  filters.priceMax > 0
                    ? "border-primary bg-primary text-white"
                    : "border-border text-text-main hover:border-primary"
                )}
              >
                {filters.priceMax > 0 ? `עד ₪${filters.priceMax.toLocaleString("he-IL")}` : "מחיר"}
                {filters.priceMax > 0 ? (
                  <X className="h-3.5 w-3.5" onClick={(e) => { e.stopPropagation(); clearFilter("priceMax"); }} />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              {showPriceDropdown && (
                <div className="absolute top-full mt-1 z-50 bg-white border border-border rounded-2xl shadow-xl p-4 min-w-[200px]">
                  <p className="text-xs font-bold text-text-muted mb-2 uppercase tracking-wide">מחיר מקסימלי</p>
                  {[3000, 5000, 8000, 12000].map((price) => (
                    <button
                      key={price}
                      className="block w-full text-right px-3 py-2 text-sm hover:bg-primary-light rounded-lg transition-colors"
                      onClick={() => { setFilters((f) => ({ ...f, priceMax: price })); setShowPriceDropdown(false); }}
                    >
                      עד ₪{price.toLocaleString("he-IL")}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Rating */}
            <div className="relative">
              <button
                onClick={() => { closeAllDropdowns(); setShowRatingDropdown((v) => !v); }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-semibold transition-colors whitespace-nowrap",
                  filters.ratingMin > 0
                    ? "border-primary bg-primary text-white"
                    : "border-border text-text-main hover:border-primary"
                )}
              >
                {filters.ratingMin > 0 ? `${filters.ratingMin}+ ⭐` : "דירוג"}
                {filters.ratingMin > 0 ? (
                  <X className="h-3.5 w-3.5" onClick={(e) => { e.stopPropagation(); clearFilter("ratingMin"); }} />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              {showRatingDropdown && (
                <div className="absolute top-full mt-1 z-50 bg-white border border-border rounded-2xl shadow-xl p-4 min-w-[160px]">
                  {[4, 4.5, 4.8].map((r) => (
                    <button
                      key={r}
                      className="flex items-center gap-2 w-full text-right px-3 py-2 text-sm hover:bg-primary-light rounded-lg transition-colors"
                      onClick={() => { setFilters((f) => ({ ...f, ratingMin: r })); setShowRatingDropdown(false); }}
                    >
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      {r}+ ומעלה
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1" />

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => { closeAllDropdowns(); setShowSortDropdown((v) => !v); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-border text-sm font-semibold text-text-main hover:border-primary transition-colors whitespace-nowrap"
              >
                מיון: {SORT_LABELS[filters.sortBy]}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {showSortDropdown && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-border rounded-2xl shadow-xl overflow-hidden min-w-[160px]">
                  {(Object.keys(SORT_LABELS) as Filters["sortBy"][]).map((key) => (
                    <button
                      key={key}
                      className={cn(
                        "block w-full text-right px-4 py-3 text-sm transition-colors",
                        filters.sortBy === key
                          ? "bg-primary-light text-primary font-semibold"
                          : "hover:bg-gray-50 text-text-main"
                      )}
                      onClick={() => { setFilters((f) => ({ ...f, sortBy: key })); setShowSortDropdown(false); }}
                    >
                      {SORT_LABELS[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Recently Viewed ── */}
      {recentlyViewed.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-text-muted">צפיתם לאחרונה</p>
            <button onClick={() => { localStorage.removeItem(RECENTLY_VIEWED_KEY); setRecentlyViewed([]); }} className="text-xs text-text-muted hover:text-text-main transition-colors">נקה</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentlyViewed.map((slug) => (
              <Link
                key={slug}
                href={`/suppliers/${slug}`}
                className="flex-shrink-0 text-xs font-medium text-primary bg-primary-light border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-colors"
              >
                {slug.replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Results ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Count + fallback notice */}
        <div className="mb-5 space-y-2">
          {isLoading ? (
            <div className="h-6 w-48 bg-gray-200 rounded-full animate-pulse" />
          ) : (
            <p className="text-text-muted text-sm font-medium">
              נמצאו{" "}
              <span className="text-text-main font-bold">{total}</span>
              {" "}ספקים {locationLabel}
            </p>
          )}
          {!isLoading && areaFallback && selectedAreas.length > 0 && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 inline-block">
              לא נמצאו ספקים ב{selectedAreas.join(", ")} — מציגים את כל הספקים הזמינים
            </p>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SupplierCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map((supplier: NormalizedSupplier) => (
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
                  isSaved={supplier.isSaved}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  הקודם
                </Button>
                <span className="text-sm font-medium text-text-muted px-4" dir="ltr">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  הבא
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Mobile filter drawer ── */}
      {showFilterDrawer && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowFilterDrawer(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-main">פילטרים</h3>
              <button
                onClick={() => setShowFilterDrawer(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* City mobile */}
            <div>
              <label className="text-sm font-bold text-text-main block mb-2">אזור</label>
              <div className="grid grid-cols-3 gap-2">
                {REGIONS.map(({ id, label, emoji }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedAreas((prev) =>
                      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
                    )}
                    className={cn(
                      "flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl border-2 text-xs font-semibold transition-colors",
                      selectedAreas.includes(id)
                        ? "border-primary bg-primary text-white"
                        : "border-border text-text-main"
                    )}
                  >
                    <span>{emoji}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price mobile */}
            <div>
              <label className="text-sm font-bold text-text-main block mb-2">מחיר מקסימלי</label>
              <div className="grid grid-cols-2 gap-2">
                {[3000, 5000, 8000, 12000].map((price) => (
                  <button
                    key={price}
                    onClick={() => setFilters((f) => ({ ...f, priceMax: price }))}
                    className={cn(
                      "py-2 px-3 rounded-xl border-2 text-sm font-medium transition-colors",
                      filters.priceMax === price
                        ? "border-primary bg-primary text-white"
                        : "border-border text-text-main"
                    )}
                  >
                    עד ₪{price.toLocaleString("he-IL")}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating mobile */}
            <div>
              <label className="text-sm font-bold text-text-main block mb-2">דירוג מינימלי</label>
              <div className="flex gap-2">
                {[4, 4.5, 4.8].map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilters((f) => ({ ...f, ratingMin: r }))}
                    className={cn(
                      "flex items-center gap-1 py-2 px-4 rounded-xl border-2 text-sm font-medium transition-colors",
                      filters.ratingMin === r
                        ? "border-primary bg-primary text-white"
                        : "border-border text-text-main"
                    )}
                  >
                    ⭐ {r}+
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setFilters({ date: "", priceMax: 0, ratingMin: 0, sortBy: "relevance" });
                  setSelectedAreas([]);
                }}
              >
                נקי הכל
              </Button>
              <Button
                fullWidth
                onClick={() => setShowFilterDrawer(false)}
              >
                הצגת תוצאות
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-text-muted">טוען...</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
