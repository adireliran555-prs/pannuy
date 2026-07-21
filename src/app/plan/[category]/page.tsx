"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Check, ChevronRight } from "lucide-react";
import { useEvent } from "@/hooks/useEvent";
import {
  getPyramidStep,
  isPlanCategory,
  formatIls,
} from "@/lib/event-planning";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { CategoryPickerDTO } from "@/types/event";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { SupplierCardSkeleton } from "@/components/ui/Skeleton";
import TopEventsLogo from "@/components/common/TopEventsLogo";
import SupplierCard from "@/components/common/SupplierCard";

async function offersFetcher(url: string): Promise<CategoryPickerDTO> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch offers");
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error ?? "Failed to fetch offers");
  return json.data as CategoryPickerDTO;
}

/** The category step: shows availability-filtered, budget-aware offers for one
 *  pyramid category as the same grid of supplier cards used on /search. Cards
 *  link to the supplier profile carrying plan context so the couple chooses a
 *  package from the profile. Skip / not-needed live in a step-level action bar. */
export default function CategoryStepPage() {
  const params = useParams<{ category: string }>();
  const category = params.category;
  const valid = isPlanCategory(category);

  const router = useRouter();
  const {
    event,
    items,
    updateItem,
    isLoading: eventLoading,
  } = useEvent();

  const item = useMemo(
    () => items.find((i) => i.category === category) ?? null,
    [items, category]
  );

  const eventId = event?.id ?? null;
  const swrKey =
    valid && eventId
      ? `/api/events/${eventId}/suppliers?category=${category}`
      : null;
  const {
    data,
    error,
    isLoading: offersLoading,
    mutate: mutateOffers,
  } = useSWR<CategoryPickerDTO>(swrKey, offersFetcher);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // notFound() throws — call it after all hooks so hook order stays stable.
  if (!valid) notFound();

  const step = getPyramidStep(category);
  const label = CATEGORY_LABELS[category] ?? category;
  const isVenue = category === "VENUE";
  const hasBudget = data?.allocatedBudget != null;

  async function commitStatus(
    busyKey: string,
    input: Parameters<typeof updateItem>[2]
  ) {
    if (!event || !item) return false;
    setBusyId(busyKey);
    setActionError("");
    try {
      const json = await updateItem(event.id, item.id, input);
      if (!json?.success) {
        setActionError(json?.error ?? "שגיאה פנימית");
        return false;
      }
      return true;
    } catch {
      setActionError("שגיאה פנימית");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function handleStatus(
    busyKey: string,
    status: "SKIPPED" | "NOT_NEEDED"
  ) {
    await commitStatus(busyKey, { status });
  }

  // ── No active plan (shouldn't happen behind the gate, but be graceful) ──
  if (!eventLoading && !event) {
    return (
      <Shell>
        <EmptyState
          emoji="🗺️"
          title="עוד לא התחלתם לתכנן"
          description="נלווה אתכם צעד־צעד ונמצא ספקים פנויים בדיוק לתאריך, לאזור ולתקציב שלכם."
          ctaLabel="בואו נתכנן אירוע יחד"
          onCta={() => router.push("/plan/new")}
        />
      </Shell>
    );
  }

  const selected = item?.status === "SELECTED";
  const suppliers = data?.suppliers ?? [];
  const showActions = !selected && suppliers.length > 0;

  return (
    <Shell>
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        {/* Header */}
        <div className="space-y-3">
          <Link
            href="/plan"
            className="inline-flex items-center gap-1 text-sm font-semibold text-text-muted transition-colors hover:text-text-main"
          >
            <ChevronRight className="h-4 w-4" />
            חזרה לתוכנית
          </Link>

          <div className="flex items-center gap-2">
            {step && <span className="text-2xl">{step.emoji}</span>}
            <h1 className="text-2xl font-black text-text-main">{label}</h1>
          </div>
          {step && <p className="text-sm text-text-muted">{step.tagline}</p>}

          {/* Context chips */}
          <div className="flex flex-wrap items-center gap-2">
            {hasBudget && (
              <Badge variant="primary" size="sm">
                תקציב מומלץ:{" "}
                <span dir="ltr">{formatIls(data!.allocatedBudget!)}</span>
              </Badge>
            )}
            {!isVenue && data?.venueName && (
              <Badge variant="default" size="sm">
                מותאם לאולם: {data.venueName}
              </Badge>
            )}
          </div>

          {/* Area-fallback notice */}
          {data?.areaFallback && (
            <div className="rounded-xl bg-warning-light p-3 text-sm text-warning">
              לא נמצאו ספקים פנויים באזור שבחרתם, אז הרחבנו את החיפוש לכל הארץ.
            </div>
          )}
        </div>

        {/* Current selection banner */}
        {selected && item?.selectedSupplier && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-success-light p-4 text-success">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-semibold">
                בחרתם: {item.selectedSupplier.name}
                {item.selectedPackage && ` · ${item.selectedPackage.nameHe}`}
                {item.committedPrice != null && (
                  <>
                    {" · "}
                    <span dir="ltr">{formatIls(item.committedPrice)}</span>
                  </>
                )}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                listRef.current?.scrollIntoView({ behavior: "smooth" })
              }
            >
              שינוי בחירה
            </Button>
          </div>
        )}

        {/* Step-level action bar (skip / not-needed) — not per-card */}
        {showActions && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => handleStatus("__skip__", "SKIPPED")}
              isLoading={busyId === "__skip__"}
              disabled={busyId !== null}
            >
              דלגו על הקטגוריה
            </Button>
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => handleStatus("__notneeded__", "NOT_NEEDED")}
              isLoading={busyId === "__notneeded__"}
              disabled={busyId !== null}
            >
              לא צריך
            </Button>
          </div>
        )}

        {/* Action error */}
        {actionError && (
          <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
            {actionError}
          </div>
        )}

        {/* Offers grid — same responsive layout as /search */}
        <div ref={listRef}>
          {offersLoading || eventLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SupplierCardSkeleton />
              <SupplierCardSkeleton />
              <SupplierCardSkeleton />
              <SupplierCardSkeleton />
            </div>
          ) : error ? (
            <EmptyState
              emoji="⚠️"
              title="לא הצלחנו לטעון ספקים"
              description="משהו השתבש בטעינת הספקים. נסו שוב."
              ctaLabel="נסו שוב"
              onCta={() => mutateOffers()}
            />
          ) : suppliers.length === 0 ? (
            <div className="space-y-4">
              <EmptyState
                emoji="😕"
                title="לא מצאנו ספקים פנויים בקטגוריה זו"
                description="לתאריך ולאזור שבחרתם אין כרגע ספקים פנויים. אפשר לדלג בינתיים ולחזור בהמשך."
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => handleStatus("__skip__", "SKIPPED")}
                  isLoading={busyId === "__skip__"}
                  disabled={busyId !== null}
                >
                  דלגו בינתיים
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => handleStatus("__notneeded__", "NOT_NEEDED")}
                  isLoading={busyId === "__notneeded__"}
                  disabled={busyId !== null}
                >
                  לא צריך את זה
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="flex flex-col gap-1.5">
                  {/* Preferred / within-budget hints (kept from the old card) */}
                  {(supplier.isPreferred || hasBudget) && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {supplier.isPreferred && (
                        <Badge variant="primary" size="sm">
                          מומלץ עבורכם
                        </Badge>
                      )}
                      {hasBudget &&
                        (supplier.withinBudget ? (
                          <Badge variant="success" size="sm">
                            בתקציב
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            מעל התקציב
                          </Badge>
                        ))}
                    </div>
                  )}
                  <SupplierCard
                    id={supplier.id}
                    slug={`${supplier.slug}?plan=${eventId}&cat=${category}`}
                    name={supplier.name}
                    city={supplier.city ?? ""}
                    profilePhoto={supplier.profilePhoto ?? ""}
                    coverPhoto={supplier.coverPhoto ?? undefined}
                    rating={supplier.rating}
                    ratingCount={supplier.ratingCount}
                    priceFrom={supplier.priceFrom ?? 0}
                    priceTo={supplier.priceTo ?? undefined}
                    category={supplier.category}
                    isAvailable
                    isVerified={supplier.isVerified}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </Shell>
  );
}

/** Full-screen frame matching the dashboard/intake surfaces. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen bg-surface">
      <header className="border-b border-border bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center px-4 py-3">
          <TopEventsLogo href="/" size="sm" />
        </div>
      </header>
      {children}
    </div>
  );
}
