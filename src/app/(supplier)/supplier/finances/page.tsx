"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import SupplierDashboardLayout from "@/components/common/SupplierDashboardLayout";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatHebrewDate } from "@/lib/utils";

type TransactionType = "EARNED" | "OWED";
type TransactionStatus = string;
type PayoutStatus = "PENDING" | "APPROVED" | "PAID" | "REJECTED";

interface Transaction {
  id: string;
  createdAt: string;
  type: TransactionType;
  counterpartName: string;
  amountIls: number;
  status: TransactionStatus;
  meetingDate: string;
}

interface FinancesData {
  netBalance: number;
  totalEarned: number;
  totalOwed: number;
  withdrawableBalance: number;
  recentTransactions: Transaction[];
}

interface Payout {
  id: string;
  amountIls: number;
  status: PayoutStatus;
  createdAt: string;
}

interface PayoutsData {
  availableBalance: number;
  payouts: Payout[];
}

const FINANCES_URL = "/api/supplier/finances";
const PAYOUTS_URL = "/api/supplier/payouts";

const financesFetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((j) => j as FinancesData);

const payoutsFetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((j) => j as PayoutsData);

function formatILS(amount: number): string {
  return `₪${amount.toLocaleString("he-IL")}`;
}

const TRANSACTION_TYPE_MAP: Record<
  TransactionType,
  { label: string; className: string }
> = {
  EARNED: { label: "הרוויח", className: "text-green-600 font-semibold" },
  OWED: { label: "חייב", className: "text-red-600 font-semibold" },
};

const PAYOUT_STATUS_MAP: Record<
  PayoutStatus,
  { label: string; variant: "warning" | "info" | "success" | "error" }
> = {
  PENDING: { label: "ממתין", variant: "warning" },
  APPROVED: { label: "אושר", variant: "info" },
  PAID: { label: "שולם", variant: "success" },
  REJECTED: { label: "נדחה", variant: "error" },
};

export default function SupplierFinancesPage() {
  const { data, isLoading } = useSWR<FinancesData>(
    FINANCES_URL,
    financesFetcher,
    { revalidateOnFocus: false }
  );

  const { data: payoutsData, isLoading: payoutsLoading } = useSWR<PayoutsData>(
    PAYOUTS_URL,
    payoutsFetcher,
    { revalidateOnFocus: false }
  );

  const withdrawableBalance = data?.withdrawableBalance ?? 0;

  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  async function submitPayout() {
    setPayoutError(null);
    const amount = Number(payoutAmount);
    if (!payoutAmount || Number.isNaN(amount) || amount <= 0) {
      setPayoutError("נא להזין סכום תקין");
      return;
    }
    if (amount > withdrawableBalance) {
      setPayoutError("הסכום גבוה מהיתרה למשיכה");
      return;
    }

    setPayoutSubmitting(true);
    try {
      const res = await fetch(PAYOUTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountIls: amount }),
      });
      if (!res.ok) {
        setPayoutError("שליחת הבקשה נכשלה, נסו שוב");
        return;
      }
      setPayoutSuccess(true);
      setPayoutAmount("");
      setShowPayoutForm(false);
      await Promise.all([mutate(FINANCES_URL), mutate(PAYOUTS_URL)]);
    } catch {
      setPayoutError("שליחת הבקשה נכשלה, נסו שוב");
    } finally {
      setPayoutSubmitting(false);
    }
  }

  const statCards = [
    {
      label: "יתרת עמלות",
      value: data ? formatILS(data.netBalance) : "—",
      colorClass: "text-primary",
    },
    {
      label: "עמלות שהרווחתם",
      value: data ? formatILS(data.totalEarned) : "—",
      colorClass: "text-green-600",
    },
    {
      label: "עמלות שחייבים לאחרים",
      value: data ? formatILS(data.totalOwed) : "—",
      colorClass: "text-red-600",
    },
  ];

  const transactions = data?.recentTransactions ?? [];
  const payouts = payoutsData?.payouts ?? [];

  const payoutDisabled = withdrawableBalance <= 0;

  return (
    <SupplierDashboardLayout>
      <div className="space-y-8" dir="rtl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-text-main">פיננסים</h1>
          <p className="text-text-muted text-sm mt-1">
            עמלות ההפניה שלכם ויתרה למשיכה
          </p>
        </div>

        {/* Withdrawable balance card */}
        <div className="bg-primary text-white rounded-2xl p-6 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-white/80">יתרה למשיכה</p>
              {isLoading ? (
                <Skeleton className="h-9 w-32 bg-white/30" />
              ) : (
                <p className="text-3xl font-black">
                  {formatILS(withdrawableBalance)}
                </p>
              )}
              <p className="text-xs text-white/70 max-w-md">
                עמלות שהרווחתם, פחות עמלות ששילמתם
              </p>
            </div>
            {!showPayoutForm && (
              <Button
                variant="secondary"
                size="sm"
                disabled={isLoading || payoutDisabled}
                className="bg-white text-primary border-white hover:bg-white/90 shrink-0"
                onClick={() => {
                  setPayoutSuccess(false);
                  setPayoutError(null);
                  setShowPayoutForm(true);
                }}
              >
                בקשת משיכה
              </Button>
            )}
          </div>

          {payoutSuccess && (
            <p className="text-sm font-semibold bg-white/15 rounded-xl px-4 py-2">
              בקשת המשיכה נשלחה ✓
            </p>
          )}

          {showPayoutForm && (
            <div className="bg-white/10 rounded-xl p-4 space-y-3">
              <div>
                <Input
                  ltr
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={withdrawableBalance}
                  placeholder={`עד ${formatILS(withdrawableBalance)}`}
                  value={payoutAmount}
                  onChange={(e) => {
                    setPayoutAmount(e.target.value);
                    setPayoutError(null);
                  }}
                  error={payoutError ?? undefined}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={payoutSubmitting}
                  className="bg-white text-primary border-white hover:bg-white/90"
                  onClick={submitPayout}
                >
                  אישור
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/15"
                  onClick={() => {
                    setShowPayoutForm(false);
                    setPayoutAmount("");
                    setPayoutError(null);
                  }}
                >
                  ביטול
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map(({ label, value, colorClass }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-border p-5 space-y-2"
            >
              <p className="text-xs font-medium text-text-muted">{label}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <p className={`text-2xl font-black ${colorClass}`}>{value}</p>
              )}
            </div>
          ))}
        </div>

        {/* How earnings work */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-2">
          <h2 className="font-bold text-text-main text-lg">איך מרוויחים</h2>
          <p className="text-text-main font-semibold">ההצטרפות חינם — בלי דמי מנוי</p>
          <p className="text-text-muted text-sm leading-relaxed">
            כשאתם מפנים זוג לספק אחר בפלטפורמה והעסקה נסגרת, אתם מרוויחים עמלת הפניה.
            על עבודות שאתם סוגרים דרך הפלטפורמה אנחנו גובים עמלה. כל היתרה שצברתם זמינה כאן למשיכה.
          </p>
        </div>

        {/* Transactions table */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-bold text-text-main">היסטוריית עסקאות</h2>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState emoji="💰" title="אין עסקאות עדיין" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-right font-semibold text-text-muted">
                      תאריך
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-text-muted">
                      סוג
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-text-muted">
                      ספק
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-text-muted">
                      סכום
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-text-muted">
                      סטטוס
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => {
                    const typeMeta = TRANSACTION_TYPE_MAP[tx.type];
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-text-muted whitespace-nowrap">
                          {formatHebrewDate(tx.meetingDate)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${typeMeta.className}`}>
                          {typeMeta.label}
                        </td>
                        <td className="px-6 py-4 text-text-main">{tx.counterpartName}</td>
                        <td className="px-6 py-4 font-semibold text-text-main whitespace-nowrap">
                          {formatILS(tx.amountIls)}
                        </td>
                        <td className="px-6 py-4 text-text-muted">{tx.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payout requests */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-bold text-text-main">בקשות משיכה</h2>
          </div>

          {payoutsLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : payouts.length === 0 ? (
            <EmptyState emoji="🏦" title="אין בקשות משיכה עדיין" />
          ) : (
            <ul className="divide-y divide-border">
              {payouts.map((p) => {
                const meta = PAYOUT_STATUS_MAP[p.status];
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-4 px-6 py-4"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-text-main">
                        {formatILS(p.amountIls)}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatHebrewDate(p.createdAt)}
                      </p>
                    </div>
                    <Badge variant={meta?.variant ?? "default"} size="sm">
                      {meta?.label ?? p.status}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </SupplierDashboardLayout>
  );
}
