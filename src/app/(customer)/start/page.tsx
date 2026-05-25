"use client";

import { useState } from "react";
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
      // In production: POST /api/auth/send-otp
      await new Promise((r) => setTimeout(r, 800));
      setFormData(data);
      setStage("otp");
    } catch {
      // handle error
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
        // In production: POST /api/auth/verify-otp
        await new Promise((r) => setTimeout(r, 600));
        // For demo: any 6-digit code works
        router.push("/start/wedding");
      } catch {
        setOtpError("קוד שגוי. נסי שנית.");
        setOtp("");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resendOtp = async () => {
    setOtp("");
    setOtpError("");
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setIsLoading(false);
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
            מצאי את הספקים המושלמים לחתונה שלך
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
                  מלאי פרטים בסיסיים כדי להמשיך
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
                    type="tel"
                    ltr
                    error={errors.phone?.message}
                    helperText="נשלח אליך קוד אימות ב-SMS"
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
                  המשיכי
                </Button>
              </form>

              <p className="text-center text-sm text-text-muted">
                בלחיצה על כפתור &apos;המשיכי&apos; אני מסכימה ל
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
                <p className="text-sm text-text-muted">לא קיבלת?</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resendOtp}
                  isLoading={isLoading}
                >
                  שלחי שנית
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => {
                  setStage("form");
                  setOtp("");
                }}
              >
                שנה מספר טלפון
              </Button>
            </>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-text-muted mt-6">
          כבר יש לך חשבון?{" "}
          <Link href="/start" className="text-primary font-semibold">
            התחברי
          </Link>
        </p>
      </div>
    </div>
  );
}
