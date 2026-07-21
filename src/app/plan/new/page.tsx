"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BudgetMode } from "@prisma/client";
import Input from "@/components/ui/Input";
import DatePickerField from "@/components/ui/DatePickerField";
import EventTypePicker from "@/components/common/EventTypePicker";
import StepShell from "@/components/plan/StepShell";
import BudgetModeToggle from "@/components/plan/BudgetModeToggle";
import KosherToggle from "@/components/plan/KosherToggle";
import VibeChips from "@/components/plan/VibeChips";
import AreaChips from "@/components/plan/AreaChips";
import { useEvent } from "@/hooks/useEvent";
import { formatIls } from "@/lib/event-planning";

const STEP_COUNT = 7;

/** Parse a free-text number field into a positive integer, or null. */
function parseNumber(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function PlanNewPage() {
  const router = useRouter();
  const { mutate } = useEvent();

  // Intake fields
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [dateFlexible, setDateFlexible] = useState(false);
  const [guestCount, setGuestCount] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [budgetMode, setBudgetMode] = useState<BudgetMode>("TOTAL");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [kosher, setKosher] = useState(false);

  // Flow state
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const guests = parseNumber(guestCount);
  const budget = parseNumber(budgetAmount);

  /** Client-side validation for the current step; "" when valid. */
  function currentStepError(): string {
    switch (step) {
      case 0:
        return type ? "" : "בחרו סוג אירוע";
      case 1:
        return date || dateFlexible ? "" : "בחרו תאריך או סמנו שהוא גמיש";
      case 2: {
        if (!guestCount.trim()) return "";
        if (guests === null) return "מספר האורחים לא תקין";
        if (guests > 5000) return "עד 5,000 אורחים";
        return "";
      }
      case 3:
        return areas.length > 0 ? "" : "בחרו לפחות אזור אחד";
      case 4:
        if (budgetMode === "PER_GUEST" && budget !== null && guests === null) {
          return "כדי לחשב תקציב לפי אורח צריך להזין מספר אורחים";
        }
        return "";
      default:
        return "";
    }
  }

  async function submit() {
    setIsLoading(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          date: date || null,
          dateFlexible,
          areas,
          city: city.trim() || null,
          guestCount: guests,
          budgetMode,
          budgetAmount: budget,
          vibeTags,
          kosher,
        }),
      });

      if (res.status === 401) {
        router.push("/start?returnTo=/plan/new");
        return;
      }

      const json = await res.json();
      if (json?.success) {
        await mutate(json.data, { revalidate: false });
        router.push("/plan");
        return;
      }

      // Server rejected — surface the Hebrew error and jump to the offending
      // step (the only hard 400 is the per-guest budget rule → budget step).
      setSubmitError(json?.error ?? "משהו השתבש, נסו שוב");
      setStep(4);
    } catch {
      setSubmitError("משהו השתבש, נסו שוב");
    } finally {
      setIsLoading(false);
    }
  }

  function handleNext() {
    const err = currentStepError();
    if (err) {
      setStepError(err);
      return;
    }
    setStepError("");
    setSubmitError("");
    if (step < STEP_COUNT - 1) {
      setStep(step + 1);
    } else {
      void submit();
    }
  }

  function handleBack() {
    setStepError("");
    setSubmitError("");
    setStep((s) => Math.max(0, s - 1));
  }

  // Per-step frame configuration.
  const STEPS = [
    { title: "איזה אירוע אתם מתכננים?", subtitle: "נתאים את התכנון לסוג האירוע" },
    { title: "מתי האירוע?", subtitle: "אפשר גם בלי תאריך סופי" },
    { title: "כמה אורחים בערך?", subtitle: "הערכה גסה מספיקה" },
    { title: "איפה יתקיים האירוע?", subtitle: "בחרו אזור אחד או יותר" },
    { title: "מה התקציב שלכם?", subtitle: "נעזור לחלק אותו נכון בין הספקים" },
    { title: "איזה סגנון מדבר אליכם?", subtitle: "אפשר לבחור כמה שרוצים" },
    { title: "האירוע כשר?", subtitle: undefined },
  ] as const;

  const canSkip = step === 5;
  const current = STEPS[step];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50"
    >
      <StepShell
        stepIndex={step}
        stepCount={STEP_COUNT}
        title={current.title}
        subtitle={current.subtitle}
        onBack={handleBack}
        onNext={handleNext}
        nextLabel={step === STEP_COUNT - 1 ? "סיימו והתחילו לתכנן" : "המשך"}
        isLoading={isLoading}
        canSkip={canSkip}
        onSkip={canSkip ? handleNext : undefined}
      >
        {submitError && (
          <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
            {submitError}
          </div>
        )}

        {/* Step 0 — event type */}
        {step === 0 && (
          <EventTypePicker
            value={type ? [type] : []}
            onChange={(ids) => {
              setType(ids[0] ?? "");
              setStepError("");
            }}
            multiple={false}
            label="סוג האירוע"
          />
        )}

        {/* Step 1 — date */}
        {step === 1 && (
          <div className="space-y-3">
            <DatePickerField
              value={date}
              onChange={(d) => {
                setDate(d);
                setStepError("");
              }}
              placeholder="בחרו תאריך"
              modalTitle="מתי האירוע?"
              clearable
            />
            <label className="flex cursor-pointer select-none items-center gap-2">
              <input
                type="checkbox"
                checked={dateFlexible}
                onChange={(e) => {
                  setDateFlexible(e.target.checked);
                  setStepError("");
                }}
                className="h-5 w-5 rounded border-border accent-primary"
              />
              <span className="text-sm font-medium text-text-main">
                התאריך עדיין גמיש
              </span>
            </label>
          </div>
        )}

        {/* Step 2 — guest count */}
        {step === 2 && (
          <div className="relative">
            <Input
              inputMode="numeric"
              value={guestCount}
              onChange={(e) => {
                setGuestCount(e.target.value);
                setStepError("");
              }}
              placeholder="לדוגמה: 250"
              className="pl-16"
              aria-label="מספר אורחים"
            />
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-text-muted">
              אורחים
            </span>
          </div>
        )}

        {/* Step 3 — areas + city */}
        {step === 3 && (
          <div className="space-y-4">
            <AreaChips
              value={areas}
              onChange={(next) => {
                setAreas(next);
                setStepError("");
              }}
            />
            <Input
              label="עיר (לא חובה)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="למשל: תל אביב"
            />
          </div>
        )}

        {/* Step 4 — budget */}
        {step === 4 && (
          <div className="space-y-4">
            <BudgetModeToggle
              value={budgetMode}
              onChange={(m) => {
                setBudgetMode(m);
                setStepError("");
              }}
            />
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-main">
                {budgetMode === "TOTAL" ? "תקציב כולל לאירוע" : "תקציב לאורח"}
              </label>
              <div className="relative">
                <span
                  dir="ltr"
                  className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted"
                >
                  ₪
                </span>
                <Input
                  ltr
                  inputMode="numeric"
                  value={budgetAmount}
                  onChange={(e) => {
                    setBudgetAmount(e.target.value);
                    setStepError("");
                  }}
                  placeholder={
                    budgetMode === "TOTAL" ? "לדוגמה: 120,000" : "לדוגמה: 350"
                  }
                  className="pl-8"
                />
              </div>
              {budgetMode === "PER_GUEST" && budget !== null && guests !== null && (
                <p className="mt-1.5 text-sm text-text-muted">
                  ≈{" "}
                  <span dir="ltr" className="font-semibold">
                    {formatIls(budget * guests)}
                  </span>{" "}
                  סה״כ ל־{guests} אורחים
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 5 — vibe */}
        {step === 5 && (
          <VibeChips value={vibeTags} onChange={setVibeTags} />
        )}

        {/* Step 6 — kosher */}
        {step === 6 && <KosherToggle value={kosher} onChange={setKosher} />}

        {stepError && (
          <p className="mt-3 text-sm font-medium text-red-500">{stepError}</p>
        )}
      </StepShell>
    </div>
  );
}
