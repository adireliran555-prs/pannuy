"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, CalendarDays } from "lucide-react";
import Button from "@/components/ui/Button";
import DatePickerField from "@/components/ui/DatePickerField";
import FormSelect from "@/components/ui/FormSelect";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";
import StepProgress from "@/components/ui/StepProgress";
import TopEventsLogo from "@/components/common/TopEventsLogo";
import { returnToFromSearch, sanitizeReturnTo } from "@/lib/return-to";
import { setEventContext } from "@/lib/event-context";
import { EVENT_TYPES } from "@/lib/event-types";
import { REGIONS } from "@/lib/regions";

const schema = z.object({
  eventDate: z.string().min(1, "חובה לבחור תאריך"),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { label: "פרטים אישיים" },
  { label: "פרטי האירוע" },
];

export default function WeddingPage() {
  return (
    <Suspense>
      <WeddingPageContent />
    </Suspense>
  );
}

function WeddingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = returnToFromSearch(searchParams.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [areasError, setAreasError] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("wedding");

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { eventDate: "" },
  });

  const eventDate = watch("eventDate");

  const onSubmit = async (data: FormData) => {
    if (selectedAreas.length === 0) {
      setAreasError("חובה לבחור לפחות אזור אחד");
      return;
    }
    setIsLoading(true);
    try {
      await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingDate: data.eventDate,
          weddingArea: selectedAreas.join(","),
        }),
      });
      setEventContext({
        date: data.eventDate,
        areas: selectedAreas,
        eventType: selectedEventType,
      });
      const safeReturn = sanitizeReturnTo(returnTo);
      if (safeReturn) {
        router.push(safeReturn);
        return;
      }
      const params = new URLSearchParams({ date: data.eventDate, areas: selectedAreas.join(",") });
      if (selectedEventType) params.set("eventType", selectedEventType);
      router.push(`/search?${params.toString()}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center px-4 py-10 sm:py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <TopEventsLogo href="/" size="lg" />
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-border/80 p-6 sm:p-8 space-y-5">
          <StepProgress steps={STEPS} currentStep={2} />

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-text-main">
              ספרו לנו על האירוע שלכם
            </h1>
            <p className="text-text-muted text-sm mt-1">
              נמצא עבורכם את הספקים המתאימים
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormSelect
              label="סוג האירוע"
              value={selectedEventType}
              onChange={setSelectedEventType}
              placeholder="בחרו סוג אירוע"
              options={EVENT_TYPES.map((t) => ({ value: t.id, label: t.label }))}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary" />
                תאריך האירוע
              </label>
              <DatePickerField
                value={eventDate}
                onChange={(date) => setValue("eventDate", date, { shouldValidate: true })}
                placeholder="בחרו תאריך"
                modalTitle="מתי האירוע?"
                error={errors.eventDate?.message}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                אזור האירוע
              </label>
              <MultiSelectDropdown
                values={selectedAreas}
                onChange={(next) => {
                  setSelectedAreas(next);
                  setAreasError("");
                }}
                options={REGIONS.map((r) => ({ value: r.id, label: r.label }))}
                placeholder="בחרו אזור אחד או יותר"
                error={areasError}
              />
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              size="lg"
              className="mt-2"
            >
              מצאו ספקים
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
