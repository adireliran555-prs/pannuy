"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import OtpInput from "@/components/ui/OtpInput";
import { validateIsraeliPhone } from "@/lib/utils";

const schema = z.object({
  phone: z
    .string()
    .refine(validateIsraeliPhone, "מספר חייב להתחיל ב-05 ולהכיל 10 ספרות"),
});

type FormData = z.infer<typeof schema>;

export default function SupplierLoginPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/supplier/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: data.phone }),
      });
      const json = await res.json();
      if (!res.ok) {
        setOtpError(json.error ?? "שגיאה בשליחת קוד");
        return;
      }
      setPhone(data.phone);
      setStage("otp");
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
        const res = await fetch("/api/supplier/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, otp: value }),
        });
        const json = await res.json();
        if (!res.ok) {
          setOtpError(json.error ?? "קוד שגוי");
          return;
        }
        router.push("/supplier/dashboard");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-rose-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-black text-primary">
            פנוי
          </Link>
          <p className="text-text-muted text-sm mt-1">
            פאנל ספקים
          </p>
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
                עדיין לא נרשמת?{" "}
                <Link href="/supplier/join" className="text-primary font-semibold">
                  הצטרפו לפנוי
                </Link>
              </p>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-black text-text-main">
                  אימות 📱
                </h1>
                <p className="text-text-muted text-sm mt-1">
                  שלחנו קוד אימות למספר{" "}
                  <span dir="ltr" className="font-semibold text-text-main">
                    {phone}
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
                  onClick={async () => {
                    setOtp("");
                    setOtpError("");
                    setIsLoading(true);
                    try {
                      await fetch("/api/supplier/auth/send-otp", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ phone }),
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  isLoading={isLoading}
                >
                  שלחו שנית
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
                שנו מספר טלפון
              </Button>
            </>
          )}
        </div>

        {/* Back to customer */}
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
