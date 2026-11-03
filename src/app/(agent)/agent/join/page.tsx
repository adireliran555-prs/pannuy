"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import OtpInput from "@/components/ui/OtpInput";
import TopEventsLogo from "@/components/common/TopEventsLogo";
import { normalizeIsraeliPhone, validateIsraeliPhone } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/branding";
import { AGENT_TERMS_URL } from "@/lib/legal";
import { AGENT_REFERRAL_RATE, formatRate } from "@/lib/commission";

const schema = z.object({
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים"),
  phone: z
    .string()
    .refine((v) => validateIsraeliPhone(v), "מספר חייב להתחיל ב־05 ולהכיל 10 ספרות"),
  email: z.string().email("כתובת מייל לא תקינה").optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

export default function AgentJoinPage() {
  const [stage, setStage] = useState<"form" | "otp">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpKey, setOtpKey] = useState(0);
  const [otpError, setOtpError] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [phone, setPhone] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setAttempted(true);
    if (!accepted) return;
    const normalized = normalizeIsraeliPhone(data.phone);
    if (!normalized) {
      setOtpError("מספר טלפון לא תקין");
      return;
    }
    setIsLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/agent/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOtpError(json.error ?? "שגיאה בשליחת קוד");
        return;
      }
      setPhone(normalized);
      setDevOtp(json.devOtp ?? null);
      if (json.skipOtp) {
        await handleOtpChange("000000", normalized);
        return;
      }
      setStage("otp");
    } catch {
      setOtpError("שגיאת תקשורת. נסו שוב.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = async (value: string, phoneOverride?: string) => {
    setOtp(value);
    setOtpError("");
    if (value.length !== 6) return;
    setIsLoading(true);
    try {
      const { name, email } = getValues();
      const res = await fetch("/api/agent/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneOverride ?? phone,
          otp: value,
          name,
          ...(email ? { email } : {}),
          agreementAccepted: accepted,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOtpError(json.error ?? "קוד שגוי");
        setOtp("");
        setOtpKey((k) => k + 1);
        return;
      }
      window.location.href = "/agent/dashboard";
    } catch {
      setOtpError("שגיאת תקשורת. נסו שוב.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-rose-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <TopEventsLogo href="/" size="lg" />
          <p className="text-text-muted text-sm mt-1">תוכנית הסוכנים</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          {stage === "form" ? (
            <>
              <div>
                <h1 className="text-2xl font-black text-text-main">הצטרפות כסוכן/ת 🤝</h1>
                <p className="text-text-muted text-sm mt-1">
                  מפנים זוגות וספקים ל־{BRAND_NAME} ומרוויחים{" "}
                  <strong>{formatRate(AGENT_REFERRAL_RATE)}</strong> מכל עסקה שנסגרה דרך ההפניה שלכם.
                  ללא צורך בפרופיל ספק.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="שם מלא" placeholder="השם שלכם" error={errors.name?.message} {...register("name")} />
                <Input
                  label="מספר טלפון"
                  placeholder="05X-XXXXXXX"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  ltr
                  helperText="יישלח אליכם קוד אימות"
                  error={errors.phone?.message ?? otpError}
                  {...register("phone")}
                />
                <Input
                  label="אימייל (אופציונלי)"
                  placeholder="you@example.com"
                  type="email"
                  ltr
                  error={errors.email?.message}
                  {...register("email")}
                />
                <label className="flex items-start gap-2 text-sm text-text-main cursor-pointer pt-2 border-t border-border">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded accent-primary"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                  />
                  <span>
                    קראתי ואני מאשר/ת את{" "}
                    <Link href={AGENT_TERMS_URL} target="_blank" className="text-primary underline">
                      תנאי תוכנית הסוכנים
                    </Link>
                    , לרבות שיעור העמלה ותנאי התשלום.
                  </span>
                </label>
                {attempted && !accepted && (
                  <p className="text-red-500 text-xs font-medium">יש לאשר את תנאי התוכנית כדי להמשיך</p>
                )}
                <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                  שלחו קוד אימות
                </Button>
              </form>

              <p className="text-center text-sm text-text-muted">
                כבר סוכנים?{" "}
                <Link href="/agent/login" className="text-primary font-semibold">
                  כניסה
                </Link>
              </p>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-black text-text-main">אימות 📱</h1>
                <p className="text-text-muted text-sm mt-1">
                  הזינו את קוד האימות שנשלח ל־
                  <span dir="ltr" className="font-semibold text-text-main">{phone}</span>
                </p>
              </div>
              <div className="flex flex-col items-center gap-4 py-4">
                {devOtp && (
                  <div className="w-full text-center bg-amber-50 border-2 border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-900 space-y-1">
                    <p className="font-bold">הקוד שלכם:</p>
                    <p dir="ltr" className="font-black tracking-[0.3em] text-2xl">{devOtp}</p>
                  </div>
                )}
                <OtpInput key={otpKey} value={otp} onChange={handleOtpChange} error={otpError} disabled={isLoading} autoFocus />
                {isLoading && <p className="text-sm text-text-muted animate-pulse">מאמת…</p>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => {
                  setStage("form");
                  setOtp("");
                  setDevOtp(null);
                  setOtpError("");
                }}
              >
                חזרה
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
