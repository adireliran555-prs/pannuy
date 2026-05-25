"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, CalendarDays } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import StepProgress from "@/components/ui/StepProgress";
import { ISRAELI_CITIES } from "@/lib/utils";

const schema = z.object({
  weddingDate: z.string().min(1, "חובה לבחור תאריך"),
  weddingCity: z.string().min(2, "חובה לבחור עיר"),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { label: "פרטים אישיים" },
  { label: "פרטי החתונה" },
];

export default function WeddingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedCity = watch("weddingCity");

  const filteredCities = ISRAELI_CITIES.filter((city) =>
    city.includes(cityQuery)
  ).slice(0, 8);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // In production: PATCH /api/user with wedding details
      await new Promise((r) => setTimeout(r, 600));
      const params = new URLSearchParams({
        date: data.weddingDate,
        city: data.weddingCity,
      });
      router.push(`/search?${params.toString()}`);
    } finally {
      setIsLoading(false);
    }
  };

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
              ספרי לנו על החתונה שלך 💍
            </h1>
            <p className="text-text-muted text-sm mt-1">
              נוכל למצוא עבורך את הצלמות הפנויות
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Wedding Date */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary" />
                תאריך החתונה
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                className={`w-full rounded-xl border px-4 py-3 text-base transition-all duration-200
                  bg-white text-text-main
                  border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                  ${errors.weddingDate ? "border-red-400" : ""}`}
                {...register("weddingDate")}
              />
              {errors.weddingDate && (
                <p className="text-sm text-red-500 font-medium">
                  {errors.weddingDate.message}
                </p>
              )}
            </div>

            {/* City with autocomplete */}
            <div className="space-y-1.5 relative">
              <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                עיר החתונה
              </label>
              <input
                type="text"
                placeholder="הקלידי שם עיר..."
                value={cityQuery || selectedCity || ""}
                onChange={(e) => {
                  setCityQuery(e.target.value);
                  setValue("weddingCity", "");
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className={`w-full rounded-xl border px-4 py-3 text-base transition-all duration-200
                  bg-white text-text-main placeholder:text-text-muted
                  border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                  ${errors.weddingCity ? "border-red-400" : ""}`}
              />
              <input type="hidden" {...register("weddingCity")} />

              {/* Suggestions dropdown */}
              {showSuggestions && cityQuery && filteredCities.length > 0 && (
                <div className="absolute z-20 w-full bg-white border border-border rounded-xl shadow-xl mt-1 overflow-hidden">
                  {filteredCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      className="w-full text-right px-4 py-3 hover:bg-primary-light text-text-main text-sm font-medium transition-colors border-b border-border/50 last:border-0"
                      onMouseDown={() => {
                        setValue("weddingCity", city);
                        setCityQuery(city);
                        setShowSuggestions(false);
                      }}
                    >
                      <MapPin className="h-3.5 w-3.5 text-text-muted inline ml-2" />
                      {city}
                    </button>
                  ))}
                </div>
              )}

              {errors.weddingCity && (
                <p className="text-sm text-red-500 font-medium">
                  {errors.weddingCity.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              size="lg"
              className="mt-4"
            >
              מצאי צלמות 🔍
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
