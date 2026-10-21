"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/common/DashboardLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DatePickerField from "@/components/ui/DatePickerField";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";
import { REGIONS } from "@/lib/regions";
import { getEventContext } from "@/lib/event-context";

const REGION_OPTIONS = REGIONS.map((r) => ({ value: r.id, label: `${r.emoji} ${r.label}` }));

const schema = z.object({
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים"),
  weddingDate: z.string().optional(),
  weddingAreas: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof schema>;

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  weddingDate: string | null;
  weddingArea: string | null;
}

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [eventType, setEventType] = useState<string | undefined>(undefined);

  useEffect(() => {
    setEventType(getEventContext()?.eventType);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    fetch("/api/users/profile")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.user) {
          const u = json.user as UserProfile;
          setProfile(u);
          reset({
            name: u.name,
            weddingDate: u.weddingDate ? u.weddingDate.split("T")[0] : "",
            weddingAreas: u.weddingArea
              ? u.weddingArea.split(",").map((a) => a.trim()).filter(Boolean)
              : [],
          });
        }
      })
      .finally(() => setIsFetching(false));
  }, [reset]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          weddingDate: data.weddingDate || undefined,
          weddingArea:
            data.weddingAreas && data.weddingAreas.length > 0
              ? data.weddingAreas.join(",")
              : undefined,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError("השמירה נכשלה. נסו שוב.");
      }
    } catch {
      setSaveError("שגיאת תקשורת. נסו שוב.");
    } finally {
      setIsLoading(false);
    }
  };

  const initials = profile?.name?.charAt(0) ?? "?";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-lg">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-text-main">
            הפרופיל שלי
          </h1>
          <p className="text-text-muted text-sm mt-1">
            עדכנו את הפרטים שלכם
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
              {initials}
            </div>
            <div>
              <p className="font-bold text-text-main">{profile?.name ?? "…"}</p>
              <p className="text-text-muted text-sm">
                {eventType === undefined || eventType === "wedding" ? "זוג בדרך 💍" : "האירוע שלכם"}
              </p>
            </div>
          </div>

          {isFetching ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
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
                <div className="flex items-center gap-3 h-12 px-4 bg-surface rounded-xl border border-border text-text-muted text-base" dir="ltr">
                  {profile?.phone ?? "—"}
                  <span className="text-xs font-medium text-text-muted me-auto" dir="rtl">
                    (לא ניתן לשינוי)
                  </span>
                </div>
              </div>

              {/* Wedding date */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-text-main">
                  תאריך האירוע
                </label>
                <DatePickerField
                  value={watch("weddingDate") ?? ""}
                  onChange={(d) => setValue("weddingDate", d, { shouldValidate: true })}
                  placeholder="בחרו את תאריך האירוע"
                  modalTitle="מתי האירוע?"
                />
              </div>

              {/* Event area — same region taxonomy the search filters use */}
              <MultiSelectDropdown
                label="אזור האירוע"
                values={watch("weddingAreas") ?? []}
                onChange={(vals) => setValue("weddingAreas", vals, { shouldDirty: true })}
                options={REGION_OPTIONS}
                placeholder="בחרו אזור או כמה אזורים"
              />

              {saveError && (
                <p role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {saveError}
                </p>
              )}

              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={isLoading}
                className="mt-2"
              >
                שמרו שינויים
              </Button>
            </form>
          )}
        </div>

        {/* Account actions */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-3">
          <h3 className="font-bold text-text-main text-sm uppercase tracking-wide">
            הגדרות חשבון
          </h3>
          <button
            type="button"
            className="w-full text-start text-sm text-red-500 hover:text-red-600 transition-colors py-2"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/start";
            }}
          >
            התנתקו
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
