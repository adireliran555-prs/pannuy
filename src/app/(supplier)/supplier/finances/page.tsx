"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import SupplierDashboardLayout from "@/components/common/SupplierDashboardLayout";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatHebrewDate } from "@/lib/utils";
import { CATEGORY_LABELS_SINGULAR } from "@/lib/categories";
import { cn } from "@/lib/utils";

type TransactionType = "EARNED" | "COMMISSION";
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

type ReferralStatus = "PENDING" | "CONFIRMED" | "PAID" | "CANCELLED";

interface Referral {
  id: string;
  supplierName: string;
  supplierCategory: string;
  supplierSlug: string;
  eventDate: string;
  amountIls: number;
  status: ReferralStatus;
  createdAt: string;
  paidAt: string | null;
}

interface FinancesData {
  totalEarned: number;
  withdrawableBalance: number;
  commissionOwed: number;
  referrals: Referral[];
  referralStats: {
    total: number;
    awaitingEvent: number;
    dueToYou: number;
    paid: number;
  };
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
  EARNED: { label: "עמלת הפניה", className: "text-green-600 font-semibold" },
  COMMISSION: { label: "עמלת פלטפורמה", className: "text-red-600 font-semibold" },
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

const REFERRAL_STATUS_MAP: Record<
  ReferralStatus,
  { label: string; variant: "warning" | "info" | "success" | "error" | "default" }
> = {
  PENDING: { label: "ממתין לאירוע", variant: "warning" },
  CONFIRMED: { label: "מגיע לך — זמין למשיכה", variant: "success" },
  PAID: { label: "שולם", variant: "info" },
  CANCELLED: { label: "בוטל", variant: "default" },
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

  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [tab, setTab] = useState<"overview" | "referrals">("overview");

  // A payout withdraws the full available balance (the server claims the exact
  // set of earnings), so there's no amount to enter.
  async function submitPayout() {
    setPayoutError(null);
    setPayoutSubmitting(true);
    try {
      const res = await fetch(PAYOUTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        setPayoutError("שליחת הבקשה נכשלה, נסו שוב");
        return;
      }
      setPayoutSuccess(true);
      await Promise.all([mutate(FINANCES_URL), mutate(PAYOUTS_URL)]);
    } catch {
      setPayoutError("שליחת הבקשה נכשלה, נסו שוב");
    } finally {
      setPayoutSubmitting(false);
    }
  }

  const statCards = [
    {
      label: "סה״כ הרווחתם מהפניות",
      value: data ? formatILS(data.totalEarned) : "—",
      colorClass: "text-green-600",
    },
    {
      label: "עמלת פלטפורמה לתשלום",
      value: data ? formatILS(data.commissionOwed) : "—",
      colorClass: "text-red-600",
    },
  ];

  const transactions = data?.recentTransactions ?? [];
  const payouts = payoutsData?.payouts ?? [];
  const referrals = data?.referrals ?? [];
  const referralStats = data?.referralStats;

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

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
          {([
            { id: "overview", label: "סקירה" },
            { id: "referrals", label: "מערכת השותפים" },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all",
                tab === id ? "bg-white text-text-main shadow-sm" : "text-text-muted hover:text-text-main"
              )}
            >
              {label}
              {id === "referrals" && (referralStats?.dueToYou ?? 0) > 0 && (
                <span className="ms-2 inline-flex items-center justify-center text-xs bg-green-500 text-white rounded-full w-5 h-5 font-bold">
                  {referralStats?.dueToYou}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "referrals" ? (
          <ReferralsTab
            referrals={referrals}
            stats={referralStats}
            isLoading={isLoading}
          />
        ) : (
        <>
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
                עמלות הפניה שאושרו וטרם נמשכו
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              isLoading={payoutSubmitting}
              disabled={isLoading || payoutDisabled}
              className="bg-white text-primary border-white hover:bg-white/90 shrink-0"
              onClick={submitPayout}
            >
              משכו {formatILS(withdrawableBalance)}
            </Button>
          </div>

          {payoutSuccess && (
            <p className="text-sm font-semibold bg-white/15 rounded-xl px-4 py-2">
              בקשת המשיכה נשלחה ✓
            </p>
          )}
          {payoutError && (
            <p className="text-sm font-semibold bg-white/15 rounded-xl px-4 py-2">
              {payoutError}
            </p>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </>
        )}
      </div>
    </SupplierDashboardLayout>
  );
}

function ReferralsTab({
  referrals,
  stats,
  isLoading,
}: {
  referrals: Referral[];
  stats?: { total: number; awaitingEvent: number; dueToYou: number; paid: number };
  isLoading: boolean;
}) {
  const fmt = (a: number) => `₪${a.toLocaleString("he-IL")}`;
  const cards = [
    { label: "סה״כ הפניות", value: stats?.total ?? 0, color: "text-text-main" },
    { label: "ממתינות לאירוע", value: stats?.awaitingEvent ?? 0, color: "text-amber-600" },
    { label: "מגיע לך", value: stats?.dueToYou ?? 0, color: "text-green-600" },
    { label: "שולמו", value: stats?.paid ?? 0, color: "text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      {/* How referrals work */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-2">
        <h2 className="font-bold text-text-main text-lg">מערכת השותפים שלכם 🔗</h2>
        <p className="text-text-muted text-sm leading-relaxed">
          כששלחתם ללקוח את הלינק האישי שלכם והוא סגר ספק אחר דרך פנוי — מגיעה לכם עמלה.
          העמלה נצברת כשהאירוע מתקיים בפועל, ואז זמינה למשיכה בלשונית &quot;סקירה&quot;.
        </p>
      </div>

      {/* Funnel stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-border p-4">
            <p className="text-xs text-text-muted">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Detailed referrals table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-bold text-text-main">פירוט הפניות</h2>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : referrals.length === 0 ? (
          <EmptyState
            emoji="🔗"
            title="עדיין אין הפניות"
            description="שתפו את הלינק האישי שלכם מהדשבורד כדי להתחיל להרוויח"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-5 py-3 text-right font-semibold text-text-muted">הספק שסגר</th>
                  <th className="px-5 py-3 text-right font-semibold text-text-muted">קטגוריה</th>
                  <th className="px-5 py-3 text-right font-semibold text-text-muted">תאריך האירוע</th>
                  <th className="px-5 py-3 text-right font-semibold text-text-muted">עמלה</th>
                  <th className="px-5 py-3 text-right font-semibold text-text-muted">סטטוס</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {referrals.map((r) => {
                  const meta = REFERRAL_STATUS_MAP[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-text-main font-medium">{r.supplierName}</td>
                      <td className="px-5 py-4 text-text-muted whitespace-nowrap">
                        {CATEGORY_LABELS_SINGULAR[r.supplierCategory] ?? r.supplierCategory}
                      </td>
                      <td className="px-5 py-4 text-text-muted whitespace-nowrap">
                        {formatHebrewDate(r.eventDate)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-text-main whitespace-nowrap">
                        {fmt(r.amountIls)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge variant={meta?.variant ?? "default"} size="sm">
                          {meta?.label ?? r.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
