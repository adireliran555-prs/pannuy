"use client";

import { useState } from "react";
import { TrendingUp, Eye, Calendar, CheckCircle, Percent, Clock } from "lucide-react";
import SupplierDashboardLayout from "@/components/common/SupplierDashboardLayout";
import { cn } from "@/lib/utils";

type Timeframe = "week" | "month" | "3months";

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  week: "השבוע",
  month: "החודש",
  "3months": "3 חודשים",
};

const STATS_BY_TIMEFRAME: Record<
  Timeframe,
  { views: number; requests: number; confirmed: number; rate: number; viewDelta: string; requestDelta: string }
> = {
  week: { views: 34, requests: 5, confirmed: 3, rate: 60, viewDelta: "+12%", requestDelta: "+2" },
  month: { views: 124, requests: 18, confirmed: 11, rate: 61, viewDelta: "+8%", requestDelta: "+5" },
  "3months": { views: 389, requests: 54, confirmed: 34, rate: 63, viewDelta: "+22%", requestDelta: "+18" },
};

const WEEK_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

const WEEK_DATA = [12, 18, 9, 22, 15, 8, 3]; // views per day
const MAX_BAR = Math.max(...WEEK_DATA);

const RECENT_ACTIVITY = [
  { text: "זוג מתל אביב צפה בפרופיל שלכם", time: "לפני 3 דקות" },
  { text: "זוג מירושלים שמר את הפרופיל שלכם", time: "לפני 18 דקות" },
  { text: "זוג מרמת גן ביקשה פגישה", time: "לפני שעה" },
  { text: "זוג מהרצליה צפה בחבילות שלכם", time: "לפני שעתיים" },
  { text: "זוג מחיפה שמר את הפרופיל שלכם", time: "לפני 3 שעות" },
  { text: "זוג מנתניה ביקשה פגישה", time: "לפני 5 שעות" },
];

export default function SupplierAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("month");
  const stats = STATS_BY_TIMEFRAME[timeframe];

  const statCards = [
    {
      label: "צפיות בפרופיל",
      value: stats.views,
      delta: stats.viewDelta,
      icon: Eye,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "בקשות לפגישה",
      value: stats.requests,
      delta: stats.requestDelta,
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
      label: "אחוז הגשה",
      value: `${stats.rate}%`,
      delta: null,
      icon: Percent,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <SupplierDashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-text-main">אנליטיקה</h1>
          <p className="text-text-muted text-sm mt-1">
            ראו כמה זוגות צפו בפרופיל ואיפה מגיעות הפניות
          </p>
        </div>

        {/* Timeframe selector */}
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

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map(({ label, value, delta, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-border p-5 space-y-3"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bg)}>
                <Icon className={cn("h-5 w-5", color)} />
              </div>
              <div>
                <div className="text-2xl font-black text-text-main">{value}</div>
                <div className="text-xs font-medium text-text-muted mt-0.5">{label}</div>
              </div>
              {delta && (
                <div className="flex items-center gap-1 text-xs font-bold text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  {delta} לעומת התקופה הקודמת
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bar chart — views by day of week */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h3 className="font-bold text-text-main mb-6">
            צפיות לפי יום בשבוע
          </h3>
          <div className="flex items-end gap-2 sm:gap-4 h-40">
            {WEEK_DATA.map((val, idx) => {
              const heightPct = Math.round((val / MAX_BAR) * 100);
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-2 flex-1"
                >
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
                      style={{ height: `${heightPct}%`, minHeight: "4px" }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-text-muted text-center whitespace-nowrap">
                    {WEEK_DAYS[idx]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-bold text-text-main">פעילות אחרונה</h3>
          </div>
          <ul className="divide-y divide-border">
            {RECENT_ACTIVITY.map(({ text, time }, idx) => (
              <li key={idx} className="flex items-center gap-4 px-6 py-4">
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                  כ
                </div>
                <div className="flex-1 text-sm text-text-main">{text}</div>
                <div className="flex items-center gap-1 text-xs text-text-muted whitespace-nowrap">
                  <Clock className="h-3 w-3" />
                  {time}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Performance tip */}
        <div className="bg-gradient-to-br from-primary-light to-amber-50 rounded-2xl border border-primary/20 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-text-main mb-1">
                טיפ לשיפור ביצועים
              </h4>
              <p className="text-text-muted text-sm leading-relaxed">
                פרופילים עם 10+ תמונות מקבלים בממוצע פי 2.5 יותר פניות.
                הוסיפו תמונות נוספות מתיק העבודות שלכם כדי לשפר את התוצאות.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SupplierDashboardLayout>
  );
}
