"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown, Star } from "lucide-react";
import { useSuppliers, NormalizedSupplier } from "@/hooks/useSuppliers";
import SupplierCard from "@/components/common/SupplierCard";
import { SupplierCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { ISRAELI_CITIES, cn } from "@/lib/utils";

interface Filters {
  city: string;
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
    city: searchParams.get("city") || "",
    priceMax: 0,
    ratingMin: 0,
    sortBy: "relevance",
  });
  const [selectedAreas, setSelectedAreas] = useState<string[]>(initialAreas);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [cityInput, setCityInput] = useState(filters.city);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [page, setPage] = useState(1);

  const effectiveArea = selectedAreas.length > 0 ? selectedAreas[0] : filters.city || undefined;

  const { suppliers, total, totalPages, isLoading } = useSuppliers({
    area: effectiveArea,
    priceMax: filters.priceMax || undefined,
    ratingMin: filters.ratingMin || undefined,
    page,
  });

  const activeFilterCount = [
    selectedAreas.length > 0 || filters.city,
    filters.priceMax > 0,
    filters.ratingMin > 0,
  ].filter(Boolean).length;

  const filteredCities = ISRAELI_CITIES.filter((c) =>
    c.includes(cityInput)
  ).slice(0, 6);

  const clearFilter = (key: keyof Filters) => {
    setFilters((f) => ({ ...f, [key]: key === "sortBy" ? "relevance" : key === "city" ? "" : 0 }));
    if (key === "city") setCityInput("");
  };

  const SORT_LABELS: Record<Filters["sortBy"], string> = {
    relevance: "רלוונטיות",
    rating: "דירוג גבוה",
    priceAsc: "מחיר עולה",
    priceDesc: "מחיר יורד",
  };

  const locationLabel = selectedAreas.length > 0
    ? `ב${selectedAreas.join(", ")}`
    : filters.city
    ? `ב${filters.city}`
    : "בכל הארץ";

  const locationDisplay = selectedAreas.length > 0
    ? selectedAreas.join(", ")
    : filters.city || "";

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 overflow-x-auto">
          {/* Mobile: filter button */}
          <button
            onClick={() => setShowFilterDrawer(true)}
            className="sm:hidden flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-border text-sm font-semibold text-text-main whitespace-nowrap hover:border-primary transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            פילטרים
            {activeFilterCount > 0 && (
              <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Desktop filters */}
          <div className="hidden sm:flex items-center gap-3 flex-1">
            {/* Location */}
            <div className="relative">
              <button
                onClick={() => setShowCitySuggestions((v) => !v)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-semibold transition-colors whitespace-nowrap max-w-[200px]",
                  locationDisplay
                    ? "border-primary bg-primary text-white"
                    : "border-border text-text-main hover:border-primary"
                )}
              >
                <span className="truncate">{locationDisplay || "כל האזורים"}</span>
                {locationDisplay ? (
                  <X
                    className="h-3.5 w-3.5 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAreas([]);
                      clearFilter("city");
                    }}
                  />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                )}
              </button>
              {showCitySuggestions && (
                <div className="absolute top-full mt-1 z-40 bg-white border border-border rounded-2xl shadow-xl min-w-[180px] overflow-hidden">
                  <div className="p-2">
                    <input
                      autoFocus
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      placeholder="הקלידו עיר..."
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:border-primary"
                    />
                  </div>
                  {filteredCities.map((c) => (
                    <button
                      key={c}
                      className="w-full text-right px-4 py-2.5 text-sm hover:bg-primary-light text-text-main transition-colors"
                      onClick={() => {
                        setFilters((f) => ({ ...f, city: c }));
                        setCityInput(c);
                        setShowCitySuggestions(false);
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="relative group">
              <button
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-semibold transition-colors whitespace-nowrap",
                  filters.priceMax > 0
                    ? "border-primary bg-primary text-white"
                    : "border-border text-text-main hover:border-primary"
                )}
              >
                {filters.priceMax > 0 ? `עד ₪${filters.priceMax.toLocaleString("he-IL")}` : "מחיר"}
                {filters.priceMax > 0 ? (
                  <X className="h-3.5 w-3.5" onClick={() => clearFilter("priceMax")} />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              <div className="hidden group-hover:block absolute top-full mt-1 z-40 bg-white border border-border rounded-2xl shadow-xl p-4 min-w-[200px]">
                <p className="text-xs font-bold text-text-muted mb-2 uppercase tracking-wide">מחיר מקסימלי</p>
                {[3000, 5000, 8000, 12000].map((price) => (
                  <button
                    key={price}
                    className="block w-full text-right px-3 py-2 text-sm hover:bg-primary-light rounded-lg transition-colors"
                    onClick={() => setFilters((f) => ({ ...f, priceMax: price }))}
                  >
                    עד ₪{price.toLocaleString("he-IL")}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="relative group">
              <button
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-semibold transition-colors whitespace-nowrap",
                  filters.ratingMin > 0
                    ? "border-primary bg-primary text-white"
                    : "border-border text-text-main hover:border-primary"
                )}
              >
                {filters.ratingMin > 0 ? `${filters.ratingMin}+ ⭐` : "דירוג"}
                {filters.ratingMin > 0 ? (
                  <X className="h-3.5 w-3.5" onClick={() => clearFilter("ratingMin")} />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              <div className="hidden group-hover:block absolute top-full mt-1 z-40 bg-white border border-border rounded-2xl shadow-xl p-4">
                {[4, 4.5, 4.8].map((r) => (
                  <button
                    key={r}
                    className="flex items-center gap-2 w-full text-right px-3 py-2 text-sm hover:bg-primary-light rounded-lg transition-colors"
                    onClick={() => setFilters((f) => ({ ...f, ratingMin: r }))}
                  >
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    {r}+ ומעלה
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1" />

            {/* Sort */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-border text-sm font-semibold text-text-main hover:border-primary transition-colors whitespace-nowrap">
                מיון: {SORT_LABELS[filters.sortBy]}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <div className="hidden group-hover:block absolute top-full left-0 mt-1 z-40 bg-white border border-border rounded-2xl shadow-xl overflow-hidden min-w-[160px]">
                {(Object.keys(SORT_LABELS) as Filters["sortBy"][]).map((key) => (
                  <button
                    key={key}
                    className={cn(
                      "block w-full text-right px-4 py-3 text-sm transition-colors",
                      filters.sortBy === key
                        ? "bg-primary-light text-primary font-semibold"
                        : "hover:bg-gray-50 text-text-main"
                    )}
                    onClick={() => setFilters((f) => ({ ...f, sortBy: key }))}
                  >
                    {SORT_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active filter chips (mobile) */}
          {selectedAreas.map((area) => (
            <button
              key={area}
              onClick={() => setSelectedAreas((prev) => prev.filter((a) => a !== area))}
              className="sm:hidden flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-full text-xs font-semibold whitespace-nowrap"
            >
              {area}
              <X className="h-3 w-3" />
            </button>
          ))}
          {!selectedAreas.length && filters.city && (
            <button
              onClick={() => clearFilter("city")}
              className="sm:hidden flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-full text-xs font-semibold whitespace-nowrap"
            >
              {filters.city}
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Count */}
        <div className="mb-5">
          {isLoading ? (
            <div className="h-6 w-48 bg-gray-200 rounded-full animate-pulse" />
          ) : (
            <p className="text-text-muted text-sm font-medium">
              נמצאו{" "}
              <span className="text-text-main font-bold">{total}</span>
              {" "}ספקים {locationLabel}
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
        ) : suppliers.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title="לא נמצאו ספקים"
            description="נסו לשנות את הפילטרים או לחפש באזור אחר"
            ctaLabel="נקי פילטרים"
            onCta={() => setFilters({ city: "", priceMax: 0, ratingMin: 0, sortBy: "relevance" })}
          />
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
                {["תל אביב", "ירושלים", "חיפה", "הרצליה", "נתניה", "ראשון לציון"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilters((f) => ({ ...f, city: c }))}
                    className={cn(
                      "py-2 px-3 rounded-xl border-2 text-sm font-medium transition-colors",
                      filters.city === c
                        ? "border-primary bg-primary text-white"
                        : "border-border text-text-main"
                    )}
                  >
                    {c}
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
                  setFilters({ city: "", priceMax: 0, ratingMin: 0, sortBy: "relevance" });
                  setCityInput("");
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
