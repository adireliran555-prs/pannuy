"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Video, Phone, Users, ChevronRight, CheckCircle } from "lucide-react";
import { MOCK_SUPPLIERS } from "@/lib/mock-data";
import Button from "@/components/ui/Button";
import StepProgress from "@/components/ui/StepProgress";
import AvailabilityCalendar from "@/components/common/AvailabilityCalendar";
import { formatHebrewDate, formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

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

  const supplier =
    MOCK_SUPPLIERS.find((s) => s.id === supplierId) || MOCK_SUPPLIERS[0];

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [meetingType, setMeetingType] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDateTimeSelect = (date: Date | null, time: string | null) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      // In production: POST /api/meetings
      await new Promise((r) => setTimeout(r, 1000));
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/meetings"), 2000);
    } finally {
      setIsLoading(false);
    }
  };

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
            {supplier.name} תאשר את הפגישה בהקדם.
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
              unoptimized
            />
          </div>
          <div>
            <p className="font-bold text-text-main">{supplier.name}</p>
            <p className="text-sm text-text-muted">{supplier.city} · {supplier.category}</p>
            <p className="text-sm font-semibold text-primary">
              החל מ-{formatPrice(supplier.priceFrom)}
            </p>
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
                  placeholder="ספרו לנו על החתונה שלכם, ואיזה קונספט אתם מחפשים..."
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
                      unoptimized
                    />
                  </div>
                  <div>
                    <p className="font-bold text-text-main">{supplier.name}</p>
                    <p className="text-sm text-text-muted">{supplier.category}</p>
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
