"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone } from "lucide-react";
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
    await new Promise((r) => setTimeout(r, 800));
    setPhone(data.phone);
    setIsLoading(false);
    setStage("otp");
  };

  const handleOtpChange = async (value: string) => {
    setOtp(value);
    setOtpError("");
    if (value.length === 6) {
      setIsLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setIsLoading(false);
      router.push("/supplier/dashboard");
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
                  הכניסי את מספר הטלפון שלך
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="relative">
                  <Input
                    label="מספר טלפון"
                    placeholder="05X-XXXXXXX"
                    type="tel"
                    ltr
                    helperText="נשלח אליך קוד אימות ב-SMS"
                    error={errors.phone?.message}
                    {...register("phone")}
                  />
                  <Phone className="absolute left-3 top-9 h-4 w-4 text-text-muted pointer-events-none" />
                </div>

                <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                  שלחי קוד אימות
                </Button>
              </form>

              <p className="text-center text-sm text-text-muted">
                עדיין לא נרשמת?{" "}
                <Link href="/supplier/join" className="text-primary font-semibold">
                  הצטרפי לפנוי
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
                    await new Promise((r) => setTimeout(r, 500));
                    setIsLoading(false);
                  }}
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
                שני מספר טלפון
              </Button>
            </>
          )}
        </div>

        {/* Back to customer */}
        <p className="text-center text-xs text-text-muted mt-6">
          את כלה?{" "}
          <Link href="/start" className="text-primary font-semibold">
            כניסה לפלטפורמת הכלות
          </Link>
        </p>
      </div>
    </div>
  );
}
