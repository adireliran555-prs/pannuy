"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, CalendarDays, Check, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import StepProgress from "@/components/ui/StepProgress";
import { cn } from "@/lib/utils";

const EVENT_TYPES = [
  { id: "wedding", label: "חתונה", emoji: "💍" },
  { id: "bar_mitzvah", label: "בר/בת מצווה", emoji: "✡️" },
  { id: "birthday", label: "יום הולדת", emoji: "🎂" },
  { id: "corporate", label: "אירוע עסקי", emoji: "💼" },
  { id: "other", label: "אחר", emoji: "🎉" },
];

const REGIONS = [
  { id: "מרכז", label: "מרכז", emoji: "🏙️" },
  { id: "תל אביב", label: "תל אביב", emoji: "🌆" },
  { id: "ירושלים", label: "ירושלים", emoji: "🕌" },
  { id: "הצפון", label: "צפון", emoji: "🌿" },
  { id: "הדרום", label: "דרום", emoji: "🌵" },
  { id: "השרון", label: "השרון", emoji: "🌊" },
];

const schema = z.object({
  eventDate: z.string().min(1, "חובה לבחור תאריך"),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { label: "פרטים אישיים" },
  { label: "פרטי האירוע" },
];

export default function WeddingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [areasError, setAreasError] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("wedding");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { eventDate: "" },
  });

  const toggleArea = (id: string) => {
    setSelectedAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
    setAreasError("");
  };

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
          weddingArea: selectedAreas[0],
        }),
      });
      const params = new URLSearchParams({ date: data.eventDate, areas: selectedAreas.join(",") });
      router.push(`/search?${params.toString()}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedEventLabel = EVENT_TYPES.find(e => e.id === selectedEventType)?.label ?? "האירוע";

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-black text-primary">
            פנוי
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          <StepProgress steps={STEPS} currentStep={2} />

          <div>
            <h1 className="text-2xl font-black text-text-main">
              ספרו לנו על האירוע שלכם ✨
            </h1>
            <p className="text-text-muted text-sm mt-1">
              נוכל למצוא עבורכם את הספקים המובילים
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Event Type */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                סוג האירוע
              </label>
              <div className="grid grid-cols-3 gap-2">
                {EVENT_TYPES.map(({ id, label, emoji }) => {
                  const selected = selectedEventType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedEventType(id)}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl border-2 text-xs font-semibold transition-all duration-150",
                        selected
                          ? "border-primary bg-primary text-white shadow-md"
                          : "border-border bg-white text-text-main hover:border-primary/50 hover:bg-primary-light/30"
                      )}
                    >
                      {selected && (
                        <span className="absolute top-1.5 left-1.5 w-4 h-4 bg-white/30 rounded-full flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </span>
                      )}
                      <span className="text-lg">{emoji}</span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event Date */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary" />
                תאריך {selectedEventLabel}
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                className={`w-full rounded-xl border px-4 py-3 text-base transition-all duration-200
                  bg-white text-text-main
                  border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                  ${errors.eventDate ? "border-red-400" : ""}`}
                {...register("eventDate")}
              />
              {errors.eventDate && (
                <p className="text-sm text-red-500 font-medium">
                  {errors.eventDate.message}
                </p>
              )}
            </div>

            {/* Region multi-select */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                אזור האירוע
                <span className="text-text-muted font-normal text-xs">(ניתן לבחור מספר אזורים)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {REGIONS.map(({ id, label, emoji }) => {
                  const selected = selectedAreas.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleArea(id)}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl border-2 text-sm font-semibold transition-all duration-150",
                        selected
                          ? "border-primary bg-primary text-white shadow-md"
                          : "border-border bg-white text-text-main hover:border-primary/50 hover:bg-primary-light/30"
                      )}
                    >
                      {selected && (
                        <span className="absolute top-1.5 left-1.5 w-4 h-4 bg-white/30 rounded-full flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </span>
                      )}
                      <span className="text-lg">{emoji}</span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
              {areasError && (
                <p className="text-sm text-red-500 font-medium">{areasError}</p>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              size="lg"
              className="mt-4"
            >
              מצאו ספקים 🔍
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
