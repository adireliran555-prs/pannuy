"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import OtpInput from "@/components/ui/OtpInput";
import { normalizeIsraeliPhone, validateIsraeliPhone } from "@/lib/utils";

const schema = z.object({
  phone: z
    .string()
    .refine(validateIsraeliPhone, "מספר חייב להתחיל ב-05 ולהכיל 10 ספרות"),
});

type FormData = z.infer<typeof schema>;

async function postJson<T>(url: string, body: unknown, timeoutMs = 20_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      throw new Error(json.error ?? "שגיאה בשרת");
    }
    return json;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("הבקשה ארכה יותר מדי. בדקו חיבור לאינטרנט ונסו שוב.");
    }
    if (err instanceof Error) throw err;
    throw new Error("שגיאת תקשורת. נסו שוב.");
  } finally {
    clearTimeout(timer);
  }
}

export default function SupplierLoginPage() {
  const [stage, setStage] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpKey, setOtpKey] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const RESEND_COOLDOWN = 45;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    fetch("/api/supplier/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) window.location.href = "/supplier/dashboard";
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const sendCode = async (rawPhone: string) => {
    const normalized = normalizeIsraeliPhone(rawPhone);
    if (!normalized) {
      setOtpError("מספר טלפון לא תקין");
      return;
    }

    setIsLoading(true);
    setOtpError("");
    try {
      const json = await postJson<{ success: boolean; devOtp?: string }>(
        "/api/supplier/auth/send-otp",
        { phone: normalized }
      );
      setPhone(normalized);
      setStage("otp");
      setOtp("");
      setOtpKey((k) => k + 1);
      setResendCooldown(RESEND_COOLDOWN);
      setDevOtp(json.devOtp ?? null);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "שגיאה בשליחת קוד");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    await sendCode(data.phone);
  };

  const handleOtpChange = async (value: string) => {
    setOtp(value);
    setOtpError("");
    if (value.length !== 6) return;

    setIsLoading(true);
    try {
      await postJson("/api/supplier/auth/verify-otp", { phone, otp: value });
      window.location.href = "/supplier/dashboard";
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "קוד שגוי");
      setOtp("");
      setOtpKey((k) => k + 1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-rose-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-black text-primary">
            פנוי
          </Link>
          <p className="text-text-muted text-sm mt-1">פאנל ספקים</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          {stage === "form" ? (
            <>
              <div>
                <h1 className="text-2xl font-black text-text-main">
                  כניסה לפאנל הספקים 📸
                </h1>
                <p className="text-text-muted text-sm mt-1">
                  הכניסו את מספר הטלפון שלכם
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                  label="מספר טלפון"
                  placeholder="05X-XXXXXXX"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  ltr
                  helperText="ישלח קוד אימות ב-SMS"
                  error={errors.phone?.message ?? otpError}
                  {...register("phone")}
                />

                <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                  שלחו קוד אימות
                </Button>
              </form>

              <p className="text-center text-sm text-text-muted">
                עדיין לא נרשמתם?{" "}
                <Link href="/supplier/join" className="text-primary font-semibold">
                  הצטרפו לפנוי
                </Link>
              </p>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-black text-text-main">אימות 📱</h1>
                <p className="text-text-muted text-sm mt-1">
                  הזינו את קוד האימות שנשלח ל־
                  <span dir="ltr" className="font-semibold text-text-main">
                    {phone}
                  </span>
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 py-4">
                {devOtp && (
                  <div className="w-full text-center bg-amber-50 border-2 border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-900 space-y-1">
                    <p className="font-bold">קוד אימות (ללא SMS כרגע)</p>
                    <p dir="ltr" className="font-black tracking-[0.3em] text-2xl">
                      {devOtp}
                    </p>
                    <p className="text-xs">העתיקו את הקוד לשדות למטה</p>
                  </div>
                )}
                <OtpInput
                  key={otpKey}
                  value={otp}
                  onChange={handleOtpChange}
                  error={otpError}
                  disabled={isLoading}
                  autoFocus
                />
                {isLoading && (
                  <p className="text-sm text-text-muted animate-pulse">מאמת...</p>
                )}
              </div>

              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-text-muted">לא קיבלתם?</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => sendCode(phone)}
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
                  setDevOtp(null);
                  setResendCooldown(0);
                  setOtpError("");
                }}
              >
                שנו מספר טלפון
              </Button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          אתם זוג?{" "}
          <Link href="/start" className="text-primary font-semibold">
            כניסה לפלטפורמת הזוגות
          </Link>
        </p>
      </div>
    </div>
  );
}
