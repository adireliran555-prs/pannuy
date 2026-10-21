"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

export default function RespondButtons({
  referralId,
  initialStatus,
}: {
  referralId: string;
  initialStatus: string;
}) {
  const resolved = ["CONNECTED", "CONVERTED", "LOST", "NO_ANSWER"].includes(initialStatus);
  const [done, setDone] = useState<null | "connected" | "not_connected">(
    initialStatus === "CONNECTED" || initialStatus === "CONVERTED"
      ? "connected"
      : resolved
        ? "not_connected"
        : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnswer, setLastAnswer] = useState<"connected" | "not_connected" | null>(null);

  const respond = async (answer: "connected" | "not_connected") => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setLastAnswer(answer);
    try {
      const res = await fetch(`/api/referrals/${referralId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(typeof j.error === "string" ? j.error : "לא הצלחנו לשמור את התשובה. נסו שוב.");
        return;
      }
      setDone(answer);
    } catch {
      setError("שגיאת תקשורת. בדקו את החיבור ונסו שוב.");
    } finally {
      setLoading(false);
    }
  };

  if (done === "connected") {
    return (
      <p className="text-center text-green-700 font-semibold text-lg">
        מעולה! שמחים שנוצר קשר 🙌
      </p>
    );
  }
  if (done === "not_connected") {
    return (
      <p className="text-center text-text-muted">
        תודה על העדכון. נדאג לבדוק מה קרה ונחזור אליכם.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={loading}
        onClick={() => respond("connected")}
        className="w-full inline-flex items-center justify-center gap-2 bg-primary-strong text-white font-bold px-6 py-3.5 rounded-xl shadow-md hover:bg-primary-dark transition-colors disabled:opacity-60"
      >
        <Check className="h-5 w-5" />
        כן, יצרנו קשר
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => respond("not_connected")}
        className="w-full inline-flex items-center justify-center gap-2 bg-white border-2 border-border text-text-main font-bold px-6 py-3.5 rounded-xl hover:border-primary transition-colors disabled:opacity-60"
      >
        <X className="h-5 w-5" />
        לא, עדיין לא
      </button>
      {error && (
        <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
          {error}
          {lastAnswer && (
            <button
              type="button"
              disabled={loading}
              onClick={() => respond(lastAnswer)}
              className="block mx-auto mt-2 font-bold underline underline-offset-2"
            >
              נסו שוב
            </button>
          )}
        </div>
      )}
    </div>
  );
}
