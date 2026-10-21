"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEvent } from "@/hooks/useEvent";
import { useMeetings } from "@/hooks/useMeetings";
import { PLAN_PYRAMID, formatIls } from "@/lib/event-planning";
import { formatHebrewDate } from "@/lib/utils";
import { getEventTypeLabel } from "@/lib/event-types";
import { CATEGORY_LABELS } from "@/lib/categories";
import { withReturnTo } from "@/lib/return-to";
import ProgressRing from "@/components/plan/ProgressRing";
import BudgetBar from "@/components/plan/BudgetBar";
import Countdown from "@/components/plan/Countdown";
import PyramidTier from "@/components/plan/PyramidTier";
import GapList from "@/components/plan/GapList";
import NextBestAction from "@/components/plan/NextBestAction";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import Navbar from "@/components/common/Navbar";
import Modal from "@/components/ui/Modal";
import DatePickerField from "@/components/ui/DatePickerField";
import AreaChips from "@/components/plan/AreaChips";
import { REGIONS } from "@/lib/regions";
import {
  ChevronDown,
  ChevronUp,
  Users,
  MapPin,
  CalendarPlus,
  CalendarDays,
  RotateCcw,
  Clock,
  CheckCircle2,
  Pencil,
} from "lucide-react";

const REGION_LABEL: Record<string, string> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r.label])
);

/** The guided plan dashboard: the couple's live plan (pyramid + budget + next
 *  action). Renders the empty invite when no plan exists, a skeleton while
 *  loading, and the full dashboard once a plan is loaded. */
export default function PlanDashboardPage() {
  const router = useRouter();
  const { event, items, summary, isLoading, error, mutate, updateEvent } = useEvent();
  const [showOptional, setShowOptional] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetError, setResetError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editFlexible, setEditFlexible] = useState(false);
  const [editAreas, setEditAreas] = useState<string[]>([]);
  const [editGuests, setEditGuests] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  function openEdit() {
    if (!event) return;
    setEditDate(event.date ? event.date.slice(0, 10) : "");
    setEditFlexible(event.dateFlexible);
    setEditAreas(event.areas);
    setEditGuests(event.guestCount != null ? String(event.guestCount) : "");
    setEditError("");
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!event || saving) return;
    setSaving(true);
    setEditError("");
    try {
      const guests = editGuests.trim() === "" ? null : Number(editGuests);
      const json = await updateEvent(event.id, {
        date: editDate || null,
        dateFlexible: editFlexible,
        areas: editAreas,
        guestCount: guests != null && Number.isFinite(guests) ? guests : null,
      });
      if (!json?.success) {
        setEditError(json?.error ?? "השמירה נכשלה. נסו שוב.");
        return;
      }
      setEditOpen(false);
    } catch {
      setEditError("שגיאת תקשורת. נסו שוב.");
    } finally {
      setSaving(false);
    }
  }

  async function startOver() {
    if (!event || resetting) return;
    setResetting(true);
    setResetError("");
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (!res.ok) {
        setResetError("לא הצלחנו לאפס את התוכנית. נסו שוב.");
        setResetting(false);
        return;
      }
      await mutate(null, { revalidate: false });
      router.push("/plan/new");
    } catch {
      setResetError("שגיאת תקשורת. נסו שוב.");
      setResetting(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-surface">
      <Navbar />

      {isLoading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="mx-auto max-w-3xl px-4 py-6">
          <EmptyState
            emoji="⚠️"
            title="לא הצלחנו לטעון את התוכנית"
            description="משהו השתבש בטעינת התוכנית שלכם. נסו שוב."
            ctaLabel="נסו שוב"
            onCta={() => mutate()}
          />
        </div>
      ) : !event || !summary ? (
        <div className="mx-auto max-w-3xl px-4 py-6">
          <EmptyState
            emoji="🗺️"
            title="עוד לא התחלתם לתכנן"
            description="נלווה אתכם צעד־צעד ונמצא ספקים פנויים בדיוק לתאריך, לאזור ולתקציב שלכם."
            ctaLabel="בואו נתכנן אירוע יחד"
            onCta={() => router.push("/plan/new")}
          />
        </div>
      ) : (
        <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-24 sm:pb-8">
          {/* Plan header */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black text-text-main">
                  {getEventTypeLabel(event.type)}
                </h1>
                <Countdown date={event.date} dateFlexible={event.dateFlexible} />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
                {event.date && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    {formatHebrewDate(event.date)}
                  </span>
                )}
                {event.guestCount != null && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {event.guestCount} אורחים
                  </span>
                )}
                {event.areas.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {event.areas.map((a) => REGION_LABEL[a] ?? a).join(" · ")}
                  </span>
                )}
                {event.kosher && (
                  <Badge variant="default" size="sm">
                    כשר
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-shrink-0 flex-col items-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={openEdit}
                leftIcon={<Pencil className="h-4 w-4" />}
              >
                עריכת פרטי האירוע
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setResetError(""); setResetOpen(true); }}
                isLoading={resetting}
                leftIcon={<RotateCcw className="h-4 w-4" />}
              >
                תוכנית חדשה
              </Button>
            </div>
          </div>

          <Modal
            open={editOpen}
            onClose={() => { if (!saving) setEditOpen(false); }}
            title="עריכת פרטי האירוע"
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-main">תאריך האירוע</label>
                <DatePickerField
                  value={editDate}
                  onChange={setEditDate}
                  modalTitle="בחרו את תאריך האירוע"
                  clearable
                />
                <label className="flex items-center gap-2 text-sm text-text-main">
                  <input
                    type="checkbox"
                    checked={editFlexible}
                    onChange={(e) => setEditFlexible(e.target.checked)}
                    className="h-4 w-4 accent-[var(--color-primary-strong)]"
                  />
                  התאריך גמיש
                </label>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-main">אזור האירוע</label>
                <AreaChips value={editAreas} onChange={setEditAreas} />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-guests" className="block text-sm font-semibold text-text-main">מספר אורחים</label>
                <input
                  id="edit-guests"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={editGuests}
                  onChange={(e) => setEditGuests(e.target.value)}
                  dir="ltr"
                  className="w-full h-12 rounded-xl border border-border bg-white px-4 text-base text-text-main text-left focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {editError && (
                <p role="alert" className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {editError}
                </p>
              )}
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setEditOpen(false)} disabled={saving}>
                  ביטול
                </Button>
                <Button fullWidth onClick={saveEdit} isLoading={saving}>
                  שמירה
                </Button>
              </div>
            </div>
          </Modal>

          <Modal
            open={resetOpen}
            onClose={() => { if (!resetting) setResetOpen(false); }}
            title="להתחיל תוכנית חדשה?"
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-sm text-text-main leading-relaxed">
                התוכנית הנוכחית תישמר בארכיון ותוכלו להתחיל מחדש.
              </p>
              {resetError && (
                <p role="alert" className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {resetError}
                </p>
              )}
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setResetOpen(false)} disabled={resetting}>
                  ביטול
                </Button>
                <Button fullWidth onClick={startOver} isLoading={resetting}>
                  כן, תוכנית חדשה
                </Button>
              </div>
            </div>
          </Modal>

          {/* Over-budget banner */}
          {summary.overBudget && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              חרגתם מהתקציב ב־
              <span dir="ltr" className="font-bold">
                {formatIls(summary.committed - summary.totalBudget)}
              </span>
              . כדאי לבחור חבילה חסכונית יותר או להסיר ספק.
            </div>
          )}

          {/* Progress + budget */}
          <Card padding="lg">
            <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center gap-2">
                <ProgressRing
                  pct={summary.progressPct}
                  sublabel="מהתוכנית הושלם"
                />
                <p className="text-xs text-text-muted">
                  {summary.selectedCount} מתוך {summary.actionableCount} נבחרו
                </p>
              </div>
              <BudgetBar
                total={summary.totalBudget}
                committed={summary.committed}
                overBudget={summary.overBudget}
                projectedTotal={summary.projectedTotal}
              />
            </div>
          </Card>

          {/* Next best action / done celebration */}
          {summary.actionableCount > 0 &&
          summary.selectedCount === summary.actionableCount ? (
            <DoneState />
          ) : (
            <NextBestAction items={items} />
          )}

          {/* Schedule meetings with the suppliers already chosen */}
          <ScheduleMeetings items={items} />

          {/* The pyramid */}
          <PlanSections
            items={items}
            showOptional={showOptional}
            onToggleOptional={() => setShowOptional((v) => !v)}
          />

          {/* Open gaps */}
          <GapList items={items} />
        </main>
      )}
    </div>
  );
}

/** Renders the pyramid tiers, split into essential (always shown) and optional
 *  (collapsed behind a toggle to reduce noise). Iterates PLAN_PYRAMID for a
 *  stable, venue-first order and joins to live item state by category. */
function PlanSections({
  items,
  showOptional,
  onToggleOptional,
}: {
  items: ReturnType<typeof useEvent>["items"];
  showOptional: boolean;
  onToggleOptional: () => void;
}) {
  const itemByCategory = new Map(items.map((i) => [i.category, i]));

  const essentialSteps = PLAN_PYRAMID.filter((s) => s.essential);
  const optionalSteps = PLAN_PYRAMID.filter((s) => !s.essential);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-black text-text-main">התוכנית שלכם</h2>

      <div className="space-y-2">
        {essentialSteps.map((step) => {
          const item = itemByCategory.get(step.category);
          if (!item) return null;
          return <PyramidTier key={step.category} item={item} step={step} />;
        })}
      </div>

      {optionalSteps.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onToggleOptional}
            className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-sm font-semibold text-text-muted transition-colors hover:text-text-main"
          >
            <span>הרחבות רשות ({optionalSteps.length})</span>
            {showOptional ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {showOptional && (
            <div className="space-y-2">
              {optionalSteps.map((step) => {
                const item = itemByCategory.get(step.category);
                if (!item) return null;
                return (
                  <PyramidTier key={step.category} item={item} step={step} />
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** Shown when every actionable category is SELECTED — the plan is complete.
 *  The CTA points at the meeting-scheduling section right below, because
 *  choosing suppliers isn't the finish line — booking the meetings is. */
function DoneState() {
  return (
    <div className="rounded-2xl bg-success-light p-6 text-center">
      <p className="text-xl font-black text-success">התוכנית מוכנה! 🎉</p>
      <p className="mt-1 text-sm text-success/90">
        כל הספקים החיוניים נבחרו. הצעד האחרון — לתאם פגישה עם כל אחד ולסגור פרטים.
      </p>
      <a href="#schedule-meetings" className="mt-4 inline-block">
        <Button variant="primary" leftIcon={<CalendarPlus className="h-4 w-4" />}>
          תאמו פגישות עם הספקים
        </Button>
      </a>
    </div>
  );
}

/** For every SELECTED supplier, a direct "תאמו פגישה" action into the existing
 *  booking flow (/book/[supplierId]) — carrying a returnTo back to the plan so
 *  the couple lands here again after booking. Renders nothing until at least
 *  one supplier has been chosen. */
/** Maps a live meeting status to the badge shown on a chosen-supplier row.
 *  PENDING is the "waiting for the supplier to respond" state Adir asked for.
 *  REJECTED/CANCELLED fall through (no active meeting) so the couple can
 *  re-request. */
const MEETING_STATE: Record<
  string,
  { label: string; icon: typeof Clock; className: string } | undefined
> = {
  PENDING: {
    label: "ממתין לתשובת הספק",
    icon: Clock,
    className: "bg-warning-light text-warning",
  },
  CONFIRMED: {
    label: "הפגישה אושרה",
    icon: CheckCircle2,
    className: "bg-success-light text-success",
  },
  COMPLETED: {
    label: "הפגישה התקיימה",
    icon: CheckCircle2,
    className: "bg-success-light text-success",
  },
};

function ScheduleMeetings({
  items,
}: {
  items: ReturnType<typeof useEvent>["items"];
}) {
  const { meetings } = useMeetings();

  // Latest active meeting per supplier (prefer PENDING/CONFIRMED/COMPLETED).
  const meetingBySupplier = new Map<string, { status: string }>();
  for (const m of meetings as { status: string; supplier?: { id: string } }[]) {
    const sid = m.supplier?.id;
    if (!sid) continue;
    if (MEETING_STATE[m.status] && !meetingBySupplier.has(sid)) {
      meetingBySupplier.set(sid, { status: m.status });
    }
  }

  const selected = items.filter(
    (i) => i.status === "SELECTED" && i.selectedSupplier != null
  );
  if (selected.length === 0) return null;

  return (
    <section id="schedule-meetings" className="scroll-mt-20 space-y-3">
      <div>
        <h2 className="text-lg font-black text-text-main">תאמו פגישות</h2>
        <p className="text-sm text-text-muted">
          בחירת ספק היא רק ההתחלה — קבעו פגישה כדי לסגור את הפרטים.
        </p>
      </div>

      <div className="space-y-2">
        {selected.map((item) => {
          const supplier = item.selectedSupplier!;
          const label = CATEGORY_LABELS[item.category] ?? item.category;
          const sub = [label, item.selectedPackage?.nameHe]
            .filter(Boolean)
            .join(" · ");
          return (
            <Card key={item.id} padding="sm">
              <div className="flex items-center gap-3">
                {/* Supplier avatar */}
                <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-2xl bg-primary-light">
                  {supplier.photoUrl ? (
                    <Image
                      src={supplier.photoUrl}
                      alt={supplier.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-lg font-black text-primary">
                      {supplier.name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Name + category · package */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-text-main">
                    {supplier.name}
                  </h3>
                  <p className="truncate text-sm text-text-muted">{sub}</p>
                </div>

                {/* Meeting state: waiting/approved badge once requested,
                    otherwise a button into the booking flow. */}
                {(() => {
                  const state = MEETING_STATE[
                    meetingBySupplier.get(supplier.id)?.status ?? ""
                  ];
                  if (state) {
                    const Icon = state.icon;
                    return (
                      <span
                        className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${state.className}`}
                      >
                        <Icon className="h-4 w-4" />
                        {state.label}
                      </span>
                    );
                  }
                  return (
                    <Link
                      href={withReturnTo(`/book/${supplier.id}`, "/plan")}
                      className="flex-shrink-0"
                    >
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<CalendarPlus className="h-4 w-4" />}
                      >
                        תאמו פגישה
                      </Button>
                    </Link>
                  );
                })()}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

/** Skeleton mirroring the populated dashboard layout. */
function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Card padding="lg">
        <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
          <Skeleton className="mx-auto h-32 w-32 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </Card>
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
