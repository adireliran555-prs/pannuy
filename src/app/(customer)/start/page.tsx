"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, User } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import OtpInput from "@/components/ui/OtpInput";
import StepProgress from "@/components/ui/StepProgress";
import { validateIsraeliPhone } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים"),
  phone: z
    .string()
    .min(10, "מספר טלפון לא תקין")
    .refine((v) => validateIsraeliPhone(v), "מספר חייב להתחיל ב-05 ולהכיל 10 ספרות"),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { label: "פרטים אישיים" },
  { label: "אימות" },
];

export default function StartPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpKey, setOtpKey] = useState(0);

  const RESEND_COOLDOWN = 45;

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: data.phone }),
      });
      const json = await res.json();
      if (!res.ok) {
        setOtpError(json.error ?? "שגיאה בשליחת קוד");
        return;
      }
      setFormData(data);
      setStage("otp");
      setResendCooldown(RESEND_COOLDOWN);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = async (value: string) => {
    setOtp(value);
    setOtpError("");

    if (value.length === 6) {
      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: formData?.phone, otp: value, name: formData?.name }),
        });
        const json = await res.json();
        if (!res.ok) {
          setOtpError(json.error ?? "קוד שגוי. נסו שנית.");
          setOtp("");
          setOtpKey((k) => k + 1);
          return;
        }
        const user = json.user;
        if (user?.weddingDate) {
          router.push("/dashboard/meetings");
        } else {
          router.push("/start/wedding");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtp("");
    setOtpError("");
    setOtpKey((k) => k + 1);
    setIsLoading(true);
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData?.phone }),
      });
      setResendCooldown(RESEND_COOLDOWN);
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
          <p className="text-text-muted mt-1 text-sm">
            מצאו את הספקים המושלמים לחתונה שלכם
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          {/* Step progress */}
          <StepProgress
            steps={STEPS}
            currentStep={stage === "form" ? 1 : 2}
          />

          {stage === "form" ? (
            <>
              <div>
                <h1 className="text-2xl font-black text-text-main">
                  היי! נשמח להכיר 👋
                </h1>
                <p className="text-text-muted text-sm mt-1">
                  מלאו פרטים בסיסיים כדי להמשיך
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="relative">
                  <Input
                    label="שם מלא"
                    placeholder="שם פרטי ושם משפחה"
                    error={errors.name?.message}
                    {...register("name")}
                  />
                  <User className="absolute left-3 top-9 h-4 w-4 text-text-muted pointer-events-none" />
                </div>

                <div className="relative">
                  <Input
                    label="מספר טלפון"
                    placeholder="05X-XXXXXXX"
                    type="text"
                    inputMode="tel"
                    ltr
                    className="pl-10"
                    error={errors.phone?.message}
                    helperText="ישלח קוד אימות ב-SMS"
                    {...register("phone")}
                  />
                  <Phone className="absolute left-3 top-9 h-4 w-4 text-text-muted pointer-events-none" />
                </div>

                <Button
                  type="submit"
                  fullWidth
                  isLoading={isLoading}
                  size="lg"
                  className="mt-2"
                >
                  המשיכו
                </Button>
              </form>

              <p className="text-center text-sm text-text-muted">
                בלחיצה על &apos;המשיכו&apos; מסכימים ל
                <Link href="#" className="text-primary font-semibold">
                  תנאי השימוש
                </Link>
              </p>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-black text-text-main">
                  אימות מספר טלפון 📱
                </h1>
                <p className="text-text-muted text-sm mt-1">
                  שלחנו קוד אימות למספר{" "}
                  <span dir="ltr" className="font-semibold text-text-main">
                    {formData?.phone}
                  </span>
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 py-4">
                <OtpInput
                  key={otpKey}
                  value={otp}
                  onChange={handleOtpChange}
                  error={otpError}
                  disabled={isLoading}
                  autoFocus
                />
                {isLoading && (
                  <p className="text-sm text-text-muted animate-pulse">
                    מאמת...
                  </p>
                )}
              </div>

              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-text-muted">לא קיבלתם?</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resendOtp}
                  isLoading={isLoading}
                  disabled={isLoading || resendCooldown > 0}
                >
                  {resendCooldown > 0
                    ? `שליחה חוזרת בעוד ${resendCooldown} שניות`
                    : "שלחו שנית"}
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => {
                  setStage("form");
                  setOtp("");
                  setResendCooldown(0);
                }}
              >
                שנו מספר טלפון
              </Button>
            </>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-text-muted mt-6">
          יש לכם כבר חשבון? אותו מספר טלפון משמש גם לכניסה וגם להרשמה.
        </p>
      </div>
    </div>
  );
}
