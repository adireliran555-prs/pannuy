"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, MapPin, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/common/DashboardLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { ISRAELI_CITIES } from "@/lib/utils";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים"),
  weddingDate: z.string().optional(),
  weddingCity: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cityInput, setCityInput] = useState("תל אביב");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "שרה ישראלי",
      weddingDate: "",
      weddingCity: "תל אביב",
    },
  });

  const filteredCities = ISRAELI_CITIES.filter((c) =>
    c.includes(cityInput)
  ).slice(0, 8);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // In production: PATCH /api/users/profile
      await new Promise((r) => setTimeout(r, 800));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-lg">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-text-main">
            הפרופיל שלי
          </h1>
          <p className="text-text-muted text-sm mt-1">
            עדכני את הפרטים שלך
          </p>
        </div>

        {/* Success toast */}
        {saveSuccess && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm font-semibold">
            <CheckCircle className="h-5 w-5" />
            הפרופיל עודכן בהצלחה!
          </div>
        )}

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-border p-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 pb-6 mb-6 border-b border-border">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-200 to-primary flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
              ש
            </div>
            <div>
              <p className="font-bold text-text-main">שרה ישראלי</p>
              <p className="text-text-muted text-sm">כלה בדרך 💍</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <Input
              label="שם מלא"
              placeholder="שם פרטי ושם משפחה"
              error={errors.name?.message}
              {...register("name")}
            />

            {/* Phone — read only */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text-main">
                מספר טלפון
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-border text-text-muted text-base" dir="ltr">
                050-1234567
                <span className="text-xs font-medium text-text-muted me-auto" dir="rtl">
                  (לא ניתן לשינוי)
                </span>
              </div>
            </div>

            {/* Wedding date */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary" />
                תאריך החתונה
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-xl border border-border px-4 py-3 text-base text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                {...register("weddingDate")}
              />
            </div>

            {/* Wedding city */}
            <div className="space-y-1.5 relative">
              <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                עיר החתונה
              </label>
              <input
                type="text"
                placeholder="הקלידי שם עיר..."
                value={cityInput}
                onChange={(e) => {
                  setCityInput(e.target.value);
                  setValue("weddingCity", "");
                  setShowCitySuggestions(true);
                }}
                onFocus={() => setShowCitySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                className="w-full rounded-xl border border-border px-4 py-3 text-base text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <input type="hidden" {...register("weddingCity")} />

              {showCitySuggestions && cityInput && filteredCities.length > 0 && (
                <div className="absolute z-20 w-full bg-white border border-border rounded-2xl shadow-xl mt-1 overflow-hidden">
                  {filteredCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      className="w-full text-right px-4 py-3 hover:bg-primary-light text-text-main text-sm font-medium transition-colors border-b border-border/50 last:border-0"
                      onMouseDown={() => {
                        setValue("weddingCity", city);
                        setCityInput(city);
                        setShowCitySuggestions(false);
                      }}
                    >
                      <MapPin className="h-3.5 w-3.5 text-text-muted inline ml-2" />
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="mt-2"
            >
              שמרי שינויים
            </Button>
          </form>
        </div>

        {/* Account actions */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-3">
          <h3 className="font-bold text-text-main text-sm uppercase tracking-wide">
            הגדרות חשבון
          </h3>
          <button className="w-full text-right text-sm text-text-muted hover:text-primary transition-colors py-2">
            שינוי מספר טלפון
          </button>
          <button className="w-full text-right text-sm text-text-muted hover:text-primary transition-colors py-2">
            התראות ועדכונים
          </button>
          <button className="w-full text-right text-sm text-red-500 hover:text-red-600 transition-colors py-2 mt-2 border-t border-border">
            התנתקי
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
