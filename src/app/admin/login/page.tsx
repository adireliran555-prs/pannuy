"use client";

import { useState } from "react";
import { Shield, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import OtpInput from "@/components/ui/OtpInput";

export default function AdminLoginPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) {
        setError(j.error ?? "שגיאה");
      } else {
        setStep("otp");
        // Dev mode (no SMS configured): the code comes back in the response —
        // fill it in and log straight in.
        if (j.devOtp) {
          setOtp(j.devOtp);
          verify(j.devOtp);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const verify = async (code: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: code }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) {
        setError(j.error ?? "קוד שגוי");
      } else {
        // Hard navigation so the admin cookie is sent and middleware
        // re-evaluates server-side.
        window.location.href = "/admin";
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-amber-50">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-border p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-7 w-7 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-black text-text-main text-center">פאנל ניהול</h1>
        <p className="text-text-muted text-sm text-center mt-1 mb-6">
          {step === "phone" ? "התחברו עם הטלפון שלכם" : `הזינו את הקוד שנשלח ל-${phone}`}
        </p>

        {step === "phone" ? (
          <form
            onSubmit={(e) => { e.preventDefault(); sendOtp(); }}
            className="space-y-4"
          >
            <Input
              label="טלפון"
              type="tel"
              ltr
              placeholder="0501234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              error={error ?? undefined}
              autoFocus
            />
            <Button
              type="submit"
              fullWidth
              isLoading={loading}
              disabled={!/^05\d{8}$/.test(phone)}
            >
              שלחו לי קוד
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <OtpInput
              value={otp}
              onChange={(v) => {
                setOtp(v);
                if (v.length === 6) verify(v);
              }}
            />
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <button
              type="button"
              className="w-full text-sm text-text-muted hover:text-text-main"
              onClick={() => { setStep("phone"); setOtp(""); setError(null); }}
            >
              חזרה
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
