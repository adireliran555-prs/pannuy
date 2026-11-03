"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type Outcome = "NOT_CONTACTED" | "TALKING" | "CLOSED" | "CLOSED_ELSEWHERE" | "NOT_CLOSING";

const OPTIONS: { value: Outcome; label: string }[] = [
  { value: "CLOSED", label: "סגרנו איתו/ה 🎉" },
  { value: "TALKING", label: "עדיין מדברים" },
  { value: "CLOSED_ELSEWHERE", label: "סגרנו עם ספק אחר" },
  { value: "NOT_CLOSING", label: "החלטנו לא להתקדם" },
  { value: "NOT_CONTACTED", label: "לא דיברנו בסוף" },
];

interface Props {
  referralId: string;
  supplierName: string;
  onDone?: (outcome: Outcome) => void;
  className?: string;
}

/** "Did you talk to {supplier}? What happened?" — one referral. */
export default function OutcomePrompt({ referralId, supplierName, onDone, className }: Props) {
  const [selected, setSelected] = useState<Outcome | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (outcome: Outcome) => {
    setLoading(true);
    setError(null);
    try {
      const n = Number(amount.replace(/[^\d]/g, ""));
      const res = await fetch(`/api/referrals/${referralId}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, ...(outcome === "CLOSED" && n > 0 ? { amountIls: n } : {}) }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(typeof j.error === "string" ? j.error : "לא הצלחנו לשמור. נסו שוב.");
        return;
      }
      setDone(true);
      onDone?.(outcome);
    } catch {
      setError("שגיאת תקשורת. נסו שוב.");
    } finally {
      setLoading(false);
    }
  };

  const pick = (o: Outcome) => {
    setSelected(o);
    if (o !== "CLOSED") void submit(o);
  };

  if (done) {
    return (
      <div className={cn("rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800", className)}>
        תודה על העדכון לגבי {supplierName} 🙏
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-primary/20 bg-primary-light/40 p-4 space-y-3", className)}>
      <div className="flex items-start gap-2">
        <MessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-text-main">דיברתם עם {supplierName}? מה קרה?</p>
          <p className="text-xs text-text-muted mt-0.5">העדכון עוזר לנו לשמור על הספקים ברמה הגבוהה ביותר.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={loading}
            onClick={() => pick(o.value)}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-sm font-semibold text-start transition-colors disabled:opacity-60",
              selected === o.value
                ? "border-primary bg-primary text-white"
                : "border-border bg-white text-text-main hover:border-primary"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {selected === "CLOSED" && (
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="flex-1">
            <Input
              label="כמה סגרתם? (₪, לא חובה)"
              type="text"
              inputMode="numeric"
              ltr
              placeholder="לדוגמה: 8500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => submit("CLOSED")}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {loading ? "שומר…" : "שליחה"}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
