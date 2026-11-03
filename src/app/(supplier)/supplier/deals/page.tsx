"use client";

import { useState } from "react";
import useSWR from "swr";
import { Receipt, Info } from "lucide-react";
import SupplierDashboardLayout from "@/components/common/SupplierDashboardLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { commissionRateFor, formatRate, DEAL_REPORT_DAYS, COMMISSION_PAYMENT_DAYS } from "@/lib/commission";
import { formatShortDate } from "@/lib/utils";

interface Report {
  id: string;
  customerName: string | null;
  customerPhone: string | null;
  eventDate: string | null;
  amountIls: number;
  commissionIls: number;
  status: "REPORTED" | "VERIFIED" | "DISPUTED";
  note: string | null;
  createdAt: string;
  customer: { name: string } | null;
}

const STATUS_LABEL: Record<Report["status"], { label: string; variant: "warning" | "success" | "error" }> = {
  REPORTED: { label: "דווח", variant: "warning" },
  VERIFIED: { label: "אומת", variant: "success" },
  DISPUTED: { label: "במחלוקת", variant: "error" },
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed");
  return (await res.json()).data as Report[];
};

const profileFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  const j = await res.json();
  return (j.data ?? j.supplier ?? j) as { category?: string } | null;
};

export default function SupplierDealsPage() {
  const { data: reports, isLoading, mutate } = useSWR("/api/supplier/deals", fetcher, { revalidateOnFocus: false });
  const { data: profile } = useSWR("/api/supplier/profile", profileFetcher, { revalidateOnFocus: false });
  const rate = commissionRateFor(profile?.category ?? "");

  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const amountNum = Number(amount.replace(/[^\d]/g, ""));
  const preview = amountNum > 0 ? Math.round(amountNum * rate) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!(amountNum > 0)) {
      setError("יש להזין סכום עסקה");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/supplier/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountIls: amountNum,
          ...(customerPhone ? { customerPhone } : {}),
          ...(customerName ? { customerName } : {}),
          ...(eventDate ? { eventDate } : {}),
          ...(note ? { note } : {}),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "הדיווח נכשל. נסו שוב.");
        return;
      }
      setSuccess(`הדיווח נשמר. עמלה לתשלום: ₪${(j.data?.commissionIls ?? 0).toLocaleString("he-IL")}`);
      setCustomerPhone(""); setCustomerName(""); setEventDate(""); setAmount(""); setNote("");
      mutate();
    } catch {
      setError("שגיאת תקשורת. נסו שוב.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SupplierDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-text-main">דיווח עסקאות</h1>
          <p className="text-text-muted text-sm mt-1">
            דיווח על עסקאות שנסגרו עם לקוחות שהגיעו דרך האתר, גם ללא פגישה באתר
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">מה ההסכם מחייב</p>
            <ul className="list-disc ps-5 space-y-0.5">
              <li>דיווח על סגירת עסקה בתוך {DEAL_REPORT_DAYS} ימים מהסגירה.</li>
              <li>עמלה בשיעור <strong>{formatRate(rate)}</strong> מהתמורה (לפני מע״מ), לתשלום בתוך {COMMISSION_PAYMENT_DAYS} ימים מקבלת כל תשלום מהלקוח.</li>
              <li>העמלה חלה גם אם התשלום מהלקוח נעשה ישירות אליכם, מחוץ לאתר.</li>
            </ul>
          </div>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-text-main">עסקה חדשה</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="טלפון הלקוח" type="tel" inputMode="tel" ltr placeholder="05X-XXXXXXX" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} helperText="עוזר לנו לשייך את העסקה לפנייה מהאתר" />
            <Input label="שם הלקוח (לא חובה)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <Input label="תאריך האירוע (לא חובה)" type="date" ltr value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            <Input label="סכום העסקה (₪, לפני מע״מ)" type="text" inputMode="numeric" ltr placeholder="לדוגמה: 8500" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <Input label="הערות (לא חובה)" value={note} onChange={(e) => setNote(e.target.value)} />
          {preview !== null && (
            <p className="text-sm text-text-muted">
              עמלת הפלטפורמה ({formatRate(rate)}): <strong className="text-text-main">₪{preview.toLocaleString("he-IL")}</strong>
            </p>
          )}
          {error && <p role="alert" className="text-sm text-red-600 font-medium">{error}</p>}
          {success && <p role="status" className="text-sm text-green-700 font-medium">{success}</p>}
          <Button type="submit" isLoading={submitting} fullWidth size="lg">שליחת דיווח</Button>
        </form>

        <section className="space-y-3">
          <h2 className="font-bold text-text-main">דיווחים קודמים</h2>
          {isLoading ? (
            <Skeleton className="h-24 w-full rounded-2xl" />
          ) : !reports || reports.length === 0 ? (
            <p className="text-sm text-text-muted bg-white rounded-2xl border border-border p-6 text-center">עדיין לא דווחו עסקאות</p>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-border p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-text-main truncate">{r.customer?.name ?? r.customerName ?? "לקוח ללא שם"}</p>
                    <p className="text-xs text-text-muted">
                      {r.eventDate ? `אירוע ${formatShortDate(r.eventDate)} · ` : ""}דווח {formatShortDate(r.createdAt)}
                    </p>
                    <p className="text-sm text-text-main mt-1">
                      ₪{r.amountIls.toLocaleString("he-IL")} · עמלה ₪{r.commissionIls.toLocaleString("he-IL")}
                    </p>
                  </div>
                  <Badge variant={STATUS_LABEL[r.status].variant}>{STATUS_LABEL[r.status].label}</Badge>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </SupplierDashboardLayout>
  );
}
