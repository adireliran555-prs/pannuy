"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Image from "next/image";
import { Video, Phone, Users, ChevronRight, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import StepProgress from "@/components/ui/StepProgress";
import Spinner from "@/components/ui/Spinner";
import AvailabilityCalendar from "@/components/common/AvailabilityCalendar";
import { formatHebrewDate, formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { withReturnTo } from "@/lib/return-to";

const CATEGORY_LABELS: Record<string, string> = {
  PHOTOGRAPHER: "צלם סטילס",
  VIDEOGRAPHER: "צלם וידיאו",
  BRIDAL_SUITE: "חדרי כלה",
  DJ: "תקליטן",
  FLORIST: "עיצוב פרחוני",
  CATERING: "קייטרינג ושפים",
  VENUE: "אולם/גן אירועים",
  HAIR_STYLIST: "מסרקת",
  MAKEUP_ARTIST: "מאפרת",
  PHOTO_BOOTH: "צלם מגנטים",
  EVENT_PRODUCER: "מפיק/הושבה",
};

// UI meeting-type id → Prisma MeetingType enum
const MEETING_TYPE_ENUM: Record<string, string> = {
  video: "VIDEO",
  phone: "PHONE",
  "in-person": "IN_PERSON",
};

const PLACEHOLDER_PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";

interface BookSupplier {
  id: string;
  name: string;
  category: string;
  city?: string | null;
  profilePhoto: string;
  priceFrom: number | null;
}

const supplierFetcher = async (url: string): Promise<BookSupplier | null> => {
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const s = json.data ?? json.supplier ?? json;
  if (!s?.id) return null;
  const photos: { cloudinaryUrl: string; type: string }[] = s.photos ?? [];
  const profilePhoto =
    photos.find((p) => p.type === "PROFILE")?.cloudinaryUrl ??
    photos[0]?.cloudinaryUrl ??
    PLACEHOLDER_PHOTO;
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    city: s.city,
    profilePhoto,
    priceFrom: s.basePriceFrom ?? null,
  };
};

// "14:00" → "15:00"
function addOneHour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function toDateOnly(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const STEPS = [
  { label: "בחרו מועד" },
  { label: "פרטי הפגישה" },
  { label: "אישור" },
];

const MEETING_TYPES = [
  {
    id: "video",
    label: "שיחת וידאו",
    icon: Video,
    sub: "Zoom / Google Meet",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    id: "phone",
    label: "שיחת טלפון",
    icon: Phone,
    sub: "שיחה ישירה",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    id: "in-person",
    label: "פגישה פנים אל פנים",
    icon: Users,
    sub: "מקום לתיאום",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const MEETING_TYPE_LABELS: Record<string, string> = {
  video: "שיחת וידאו",
  phone: "שיחת טלפון",
  "in-person": "פגישה פנים אל פנים",
};

interface PageProps {
  params: Promise<{ supplierId: string }>;
}

export default function BookPage({ params }: PageProps) {
  const { supplierId } = use(params);
  const router = useRouter();

  const { data: supplier, isLoading: supplierLoading } = useSWR(
    `/api/suppliers/${supplierId}`,
    supplierFetcher,
    { revalidateOnFocus: false }
  );

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [meetingType, setMeetingType] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) {
          router.replace(
            withReturnTo("/start", `/book/${supplierId}`)
          );
          return;
        }
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, [router, supplierId]);

  const handleDateTimeSelect = (date: Date | null, time: string | null) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const handleConfirm = async () => {
    if (!supplier || !selectedDate || !selectedTime || !meetingType) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: supplier.id,
          date: toDateOnly(selectedDate),
          startTime: selectedTime,
          endTime: addOneHour(selectedTime),
          meetingType: MEETING_TYPE_ENUM[meetingType] ?? "VIDEO",
          notes: notes || undefined,
        }),
      });

      if (res.status === 401) {
        router.push(withReturnTo("/start", `/book/${supplierId}`));
        return;
      }
      if (res.status === 409) {
        setError("המועד נתפס בינתיים. בחרו מועד אחר.");
        setStep(1);
        return;
      }
      if (!res.ok) {
        setError("משהו השתבש. נסו שוב.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/meetings"), 2000);
    } catch {
      setError("בעיית תקשורת. בדקו את החיבור ונסו שוב.");
    } finally {
      setIsLoading(false);
    }
  };

  if (supplierLoading || !authChecked) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <p className="text-lg font-bold text-text-main">הספק לא נמצא</p>
          <Button onClick={() => router.push("/search")}>חזרה לחיפוש</Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-text-main">
            הפגישה נקבעה! 🎉
          </h1>
          <p className="text-text-muted">
            הבקשה נשלחה — נאשר לכם בהקדם.
          </p>
          <p className="text-sm text-text-muted animate-pulse">
            מעבירים לפגישות שלכם...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Supplier summary */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-6 flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-primary-light flex-shrink-0">
            <Image
              src={supplier.profilePhoto}
              alt={supplier.name}
              fill
              className="object-cover"

            />
          </div>
          <div>
            <p className="font-bold text-text-main">{supplier.name}</p>
            <p className="text-sm text-text-muted">
              {supplier.city ? `${supplier.city} · ` : ""}
              {CATEGORY_LABELS[supplier.category] ?? supplier.category}
            </p>
            {supplier.priceFrom != null && (
              <p className="text-sm font-semibold text-primary">
                החל מ-{formatPrice(supplier.priceFrom)}
              </p>
            )}
          </div>
        </div>

        {/* Step progress */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-6">
          <StepProgress steps={STEPS} currentStep={step} />
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-border p-6">
          {/* ── Step 1: Date + Time ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-text-main mb-1">
                  בחרו מועד לפגישה
                </h2>
                <p className="text-text-muted text-sm">
                  בחרו תאריך ושעה מתאימים
                </p>
              </div>
              <AvailabilityCalendar
                supplierId={supplier.id}
                onSelectionChange={handleDateTimeSelect}
              />
              <Button
                fullWidth
                size="lg"
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(2)}
              >
                המשיכו
              </Button>
            </div>
          )}

          {/* ── Step 2: Meeting type + notes ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-text-main mb-1">
                  איך תרצו להיפגש?
                </h2>
                <p className="text-text-muted text-sm">
                  {selectedDate && formatHebrewDate(selectedDate)} בשעה{" "}
                  <span dir="ltr">{selectedTime}</span>
                </p>
              </div>

              <div className="space-y-3">
                {MEETING_TYPES.map(({ id, label, icon: Icon, sub, color, bg }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMeetingType(id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-right",
                      meetingType === id
                        ? "border-primary bg-primary-light/30"
                        : "border-border hover:border-primary/40 hover:bg-surface"
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>
                      <Icon className={cn("h-5 w-5", color)} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-text-main">{label}</p>
                      <p className="text-sm text-text-muted">{sub}</p>
                    </div>
                    {meetingType === id && (
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-semibold text-text-main block mb-2">
                  הערות (אופציונלי)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ספרו לנו על האירוע שלכם, ואיזה קונספט אתם מחפשים..."
                  rows={4}
                  className="w-full rounded-xl border-2 border-border px-4 py-3 text-base text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(1)} className="flex-shrink-0">
                  <ChevronRight className="h-4 w-4" />
                  חזרה
                </Button>
                <Button fullWidth disabled={!meetingType} onClick={() => setStep(3)}>
                  המשיכו
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-text-main mb-1">
                  אישור פגישה
                </h2>
                <p className="text-text-muted text-sm">
                  בדקו את הפרטים ואשרו
                </p>
              </div>

              {/* Summary card */}
              <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-primary-light">
                    <Image
                      src={supplier.profilePhoto}
                      alt={supplier.name}
                      fill
                      className="object-cover"

                    />
                  </div>
                  <div>
                    <p className="font-bold text-text-main">{supplier.name}</p>
                    <p className="text-sm text-text-muted">
                      {CATEGORY_LABELS[supplier.category] ?? supplier.category}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">תאריך</span>
                    <span className="font-semibold text-text-main">
                      {selectedDate && formatHebrewDate(selectedDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">שעה</span>
                    <span className="font-semibold text-text-main ltr">
                      {selectedTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">סוג פגישה</span>
                    <span className="font-semibold text-text-main">
                      {meetingType && MEETING_TYPE_LABELS[meetingType]}
                    </span>
                  </div>
                  {notes && (
                    <div className="text-sm">
                      <span className="text-text-muted block mb-1">הערות</span>
                      <p className="text-text-main bg-white rounded-xl px-3 py-2 border border-border">
                        {notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
                <CheckCircle className="h-4 w-4 inline ml-2" />
                הפגישה חינמית ואינה מחייבת בחירה בספק
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setStep(2)}
                  className="flex-shrink-0"
                >
                  <ChevronRight className="h-4 w-4" />
                  חזרה
                </Button>
                <Button
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                  onClick={handleConfirm}
                >
                  אשרו פגישה ✓
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
