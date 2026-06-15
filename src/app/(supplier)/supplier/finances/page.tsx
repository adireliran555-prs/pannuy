"use client";

import useSWR from "swr";
import SupplierDashboardLayout from "@/components/common/SupplierDashboardLayout";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatHebrewDate } from "@/lib/utils";

type SubscriptionStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
type TransactionType = "EARNED" | "OWED";
type TransactionStatus = string;

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
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartAt?: string | null;
  recentTransactions: Transaction[];
}

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((j) => j as FinancesData);

function formatILS(amount: number): string {
  return `₪${amount.toLocaleString("he-IL")}`;
}

const SUBSCRIPTION_STATUS_MAP: Record<
  SubscriptionStatus,
  { label: string; variant: "success" | "default" | "error" }
> = {
  ACTIVE: { label: "פעיל", variant: "success" },
  INACTIVE: { label: "לא פעיל", variant: "default" },
  SUSPENDED: { label: "מושהה", variant: "error" },
};

const TRANSACTION_TYPE_MAP: Record<
  TransactionType,
  { label: string; className: string }
> = {
  EARNED: { label: "הרוויח", className: "text-green-600 font-semibold" },
  OWED: { label: "חייב", className: "text-red-600 font-semibold" },
};

export default function SupplierFinancesPage() {
  const { data, isLoading } = useSWR<FinancesData>(
    "/api/supplier/finances",
    fetcher,
    { revalidateOnFocus: false }
  );

  const statCards = [
    {
      label: "יתרת עמלות",
      value: data ? formatILS(data.netBalance) : "—",
      colorClass: "text-primary",
      bgClass: "bg-primary-light",
    },
    {
      label: "עמלות שהרווחתם",
      value: data ? formatILS(data.totalEarned) : "—",
      colorClass: "text-green-600",
      bgClass: "bg-green-50",
    },
    {
      label: "עמלות שחייבים לאחרים",
      value: data ? formatILS(data.totalOwed) : "—",
      colorClass: "text-red-600",
      bgClass: "bg-red-50",
    },
  ];

  const subStatus = (data?.subscriptionStatus ?? "INACTIVE") as SubscriptionStatus;
  const subMeta = SUBSCRIPTION_STATUS_MAP[subStatus];
  const subscriptionStartAt = data?.subscriptionStartAt;

  const transactions = data?.recentTransactions ?? [];

  return (
    <SupplierDashboardLayout>
      <div className="space-y-8" dir="rtl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-text-main">פיננסים ומנוי</h1>
          <p className="text-text-muted text-sm mt-1">
            מצב המנוי שלכם ועמלות שותפים
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map(({ label, value, colorClass, bgClass }) => (
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

        {/* Subscription card */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-text-main text-lg">מנוי חודשי</h2>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <Badge variant={subMeta.variant}>{subMeta.label}</Badge>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-text-main font-semibold">
              ₪1,000 + מע&quot;מ לחודש
            </p>
            {!isLoading && subscriptionStartAt && (
              <p className="text-text-muted text-sm">
                פעיל מאז {formatHebrewDate(subscriptionStartAt)}
              </p>
            )}
            {isLoading && <Skeleton className="h-4 w-40" />}
          </div>
          {!isLoading && subStatus !== "ACTIVE" && (
            <Button size="sm">הפעלת מנוי</Button>
          )}
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
      </div>
    </SupplierDashboardLayout>
  );
}
