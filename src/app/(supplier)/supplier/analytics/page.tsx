"use client";

import { useState } from "react";
import useSWR from "swr";
import { TrendingUp, Eye, Calendar, CheckCircle, Percent, Clock, Heart, Bookmark } from "lucide-react";
import SupplierDashboardLayout from "@/components/common/SupplierDashboardLayout";
import { cn, formatRelativeHebrew } from "@/lib/utils";

type Timeframe = "week" | "month" | "3months";

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  week: "השבוע",
  month: "החודש",
  "3months": "3 חודשים",
};

const WEEK_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

interface AnalyticsData {
  views: number;
  requests: number;
  confirmed: number;
  rate: number;
  viewDeltaPct: number;
  requestDelta: number;
  weekData: number[];
  activity: Array<{ kind: "view" | "save" | "meeting"; text: string; at: string }>;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((j) => j.data as AnalyticsData);

export default function SupplierAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("month");
  const { data, isLoading } = useSWR<AnalyticsData>(
    `/api/supplier/analytics?tf=${timeframe}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const stats = data ?? {
    views: 0, requests: 0, confirmed: 0, rate: 0,
    viewDeltaPct: 0, requestDelta: 0, weekData: [0, 0, 0, 0, 0, 0, 0],
    activity: [],
  };
  const maxBar = Math.max(1, ...stats.weekData);

  const statCards = [
    {
      label: "צפיות בפרופיל",
      value: stats.views,
      delta: stats.viewDeltaPct !== 0 ? `${stats.viewDeltaPct > 0 ? "+" : ""}${stats.viewDeltaPct}%` : null,
      icon: Eye,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "בקשות לפגישה",
      value: stats.requests,
      delta: stats.requestDelta !== 0 ? `${stats.requestDelta > 0 ? "+" : ""}${stats.requestDelta}` : null,
      icon: Calendar,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "פגישות שאושרו",
      value: stats.confirmed,
      delta: null,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "שיעור אישור",
      value: `${stats.rate}%`,
      delta: null,
      icon: Percent,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  const ICONS = { view: Eye, save: Bookmark, meeting: Heart };

  return (
    <SupplierDashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-black text-text-main">אנליטיקה</h1>
          <p className="text-text-muted text-sm mt-1">
            ראו כמה זוגות צפו בפרופיל ואיפה מגיעות הפניות
          </p>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
          {(Object.keys(TIMEFRAME_LABELS) as Timeframe[]).map((key) => (
            <button
              key={key}
              onClick={() => setTimeframe(key)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                timeframe === key
                  ? "bg-white text-text-main shadow-sm"
                  : "text-text-muted hover:text-text-main"
              )}
            >
              {TIMEFRAME_LABELS[key]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map(({ label, value, delta, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-border p-5 space-y-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bg)}>
                <Icon className={cn("h-5 w-5", color)} />
              </div>
              <div>
                <div className="text-2xl font-black text-text-main">
                  {isLoading ? "—" : value}
                </div>
                <div className="text-xs font-medium text-text-muted mt-0.5">{label}</div>
              </div>
              {delta && (
                <div className={cn("flex items-center gap-1 text-xs font-bold", delta.startsWith("-") ? "text-red-600" : "text-green-600")}>
                  <TrendingUp className="h-3 w-3" />
                  {delta} לעומת התקופה הקודמת
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-border p-6">
          <h3 className="font-bold text-text-main mb-6">צפיות לפי יום בשבוע</h3>
          <div className="flex items-end gap-2 sm:gap-4 h-40">
            {stats.weekData.map((val, idx) => {
              const heightPct = Math.round((val / maxBar) * 100);
              return (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-xs font-bold text-text-muted">{val}</span>
                  <div className="w-full relative" style={{ height: "100px" }}>
                    <div
                      className={cn(
                        "absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-500",
                        heightPct > 70
                          ? "bg-primary"
                          : heightPct > 40
                          ? "bg-primary-light"
                          : "bg-gray-100"
                      )}
                      style={{ height: `${Math.max(heightPct, 3)}%`, minHeight: "4px" }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-text-muted text-center whitespace-nowrap">
                    {WEEK_DAYS[idx]}
                  </span>
                </div>
              );
            })}
          </div>
          {stats.views === 0 && !isLoading && (
            <p className="text-xs text-text-muted text-center mt-4">
              עדיין אין צפיות בפרופיל. ככל שהפרופיל יופיע יותר, הנתונים כאן יתחילו להצטבר.
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-bold text-text-main">פעילות אחרונה</h3>
          </div>
          {stats.activity.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-text-muted">
              {isLoading ? "טוען..." : "אין פעילות עדיין"}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {stats.activity.map((a, idx) => {
                const Icon = ICONS[a.kind];
                return (
                  <li key={idx} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary flex-shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-sm text-text-main">{a.text}</div>
                    <div className="flex items-center gap-1 text-xs text-text-muted whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      {formatRelativeHebrew(a.at)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-gradient-to-br from-primary-light to-amber-50 rounded-2xl border border-primary/20 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-text-main mb-1">טיפ לשיפור ביצועים</h4>
              <p className="text-text-muted text-sm leading-relaxed">
                פרופילים עם 10+ תמונות מקבלים בממוצע פי 2.5 יותר פניות. הוסיפו תמונות נוספות מתיק העבודות שלכם כדי לשפר את התוצאות.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SupplierDashboardLayout>
  );
}
