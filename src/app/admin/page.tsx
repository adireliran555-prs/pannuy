"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Users,
  Briefcase,
  CalendarCheck,
  MessageSquare,
  Eye,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import AdminLayout from "@/components/common/AdminLayout";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/categories";

type Timeframe = "week" | "month" | "3months";
const TF_LABEL: Record<Timeframe, string> = {
  week: "7 ימים",
  month: "30 ימים",
  "3months": "90 ימים",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "ממתין",
  CONFIRMED: "מאושר",
  REJECTED: "נדחה",
  CANCELLED: "בוטל",
  COMPLETED: "הסתיים",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#10b981",
  REJECTED: "#ef4444",
  CANCELLED: "#9ca3af",
  COMPLETED: "#3b82f6",
};

const CATEGORY_COLOR: Record<string, string> = {
  PHOTOGRAPHER: "#b08964",
  VIDEOGRAPHER: "#8b5cf6",
  BRIDAL_SUITE: "#ec4899",
  DJ: "#06b6d4",
  FLORIST: "#10b981",
  CATERING: "#f59e0b",
};

interface StatsData {
  timeframe: string;
  totals: {
    customers: number;
    suppliers: number;
    verifiedSuppliers: number;
    activeSuppliers: number;
    reviews: number;
    profileViews: number;
    avgRating: number;
  };
  period: {
    newCustomers: number;
    customerDeltaPct: number;
    newSuppliers: number;
    newMeetings: number;
    meetingDeltaPct: number;
    newProfileViews: number;
  };
  meetingsByStatus: Array<{ status: string; count: number }>;
  suppliersByCategory: Array<{ category: string; count: number }>;
  customersByArea: Array<{ area: string; count: number }>;
  topByRating: Array<{ id: string; name: string; slug: string; ratingAvg: number; ratingCount: number; category: string }>;
  topByMeetings: Array<{ id: string; name: string; slug: string; category: string; count: number }>;
  series: {
    signups: Array<{ date: string; count: number }>;
    meetings: Array<{ date: string; count: number }>;
    views: Array<{ date: string; count: number }>;
  };
}

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((j) => j.data as StatsData);

export default function AdminDashboard() {
  const [tf, setTf] = useState<Timeframe>("month");
  const { data, isLoading } = useSWR<StatsData>(
    `/api/admin/stats?tf=${tf}`,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 60_000 }
  );

  const cards = [
    {
      label: "לקוחות",
      value: data?.totals.customers ?? 0,
      delta: data?.period.customerDeltaPct,
      sub: `+${data?.period.newCustomers ?? 0} בתקופה`,
      icon: Users,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "ספקים",
      value: data?.totals.suppliers ?? 0,
      sub: `${data?.totals.verifiedSuppliers ?? 0} מאומתים · ${data?.totals.activeSuppliers ?? 0} פעילים`,
      icon: Briefcase,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "פגישות בתקופה",
      value: data?.period.newMeetings ?? 0,
      delta: data?.period.meetingDeltaPct,
      sub: `סה״כ פעילות`,
      icon: CalendarCheck,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "ביקורות",
      value: data?.totals.reviews ?? 0,
      sub: `מצטברות`,
      icon: MessageSquare,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "צפיות בפרופילים",
      value: data?.totals.profileViews ?? 0,
      sub: `+${data?.period.newProfileViews ?? 0} בתקופה`,
      icon: Eye,
      color: "text-rose-600 bg-rose-50",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-text-main">סקירה כללית</h1>
            <p className="text-sm text-text-muted mt-1">
              {isLoading ? "טוען נתונים..." : `מתעדכן בכל דקה · תקופה: ${TF_LABEL[tf]}`}
            </p>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
            {(Object.keys(TF_LABEL) as Timeframe[]).map((key) => (
              <button
                key={key}
                onClick={() => setTf(key)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-sm font-semibold transition-all",
                  tf === key ? "bg-white shadow-sm text-text-main" : "text-text-muted"
                )}
              >
                {TF_LABEL[key]}
              </button>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {cards.map(({ label, value, delta, sub, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-border p-5">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-black text-text-main">{value}</div>
              <div className="text-xs text-text-muted mt-0.5">{label}</div>
              {(delta !== undefined && delta !== null) || sub ? (
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  {delta !== undefined && delta !== null && delta !== 0 && (
                    <span className={cn("font-bold inline-flex items-center gap-0.5", delta > 0 ? "text-green-600" : "text-red-600")}>
                      {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {delta > 0 ? "+" : ""}{delta}%
                    </span>
                  )}
                  {sub && <span className="text-text-muted">{sub}</span>}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {/* Time series — signups + meetings + views */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard title="הרשמות לקוחות">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data?.series.signups ?? []}>
                <defs>
                  <linearGradient id="signupsG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip content={<DateTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#signupsG)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="פגישות חדשות">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data?.series.meetings ?? []}>
                <defs>
                  <linearGradient id="meetingsG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip content={<DateTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#10b981" fill="url(#meetingsG)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="צפיות בפרופילים">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data?.series.views ?? []}>
                <defs>
                  <linearGradient id="viewsG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b08964" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#b08964" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip content={<DateTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#b08964" fill="url(#viewsG)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Distributions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="פגישות לפי סטטוס">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data?.meetingsByStatus.map((m) => ({ name: STATUS_LABEL[m.status] ?? m.status, value: m.count, status: m.status })) ?? []}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                >
                  {(data?.meetingsByStatus ?? []).map((m) => (
                    <Cell key={m.status} fill={STATUS_COLOR[m.status] ?? "#9ca3af"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="ספקים לפי קטגוריה">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data?.suppliersByCategory.map((s) => ({ name: CATEGORY_LABELS[s.category] ?? s.category, value: s.count, category: s.category })) ?? []}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                >
                  {(data?.suppliersByCategory ?? []).map((s) => (
                    <Cell key={s.category} fill={CATEGORY_COLOR[s.category] ?? "#9ca3af"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Top suppliers */}
        <div className="grid grid-cols-1 gap-4">
          <ChartCard title="ספקים מובילים — בקשות פגישה">
            <ResponsiveContainer width="100%" height={Math.max(180, ((data?.topByMeetings ?? []).length || 1) * 36)}>
              <BarChart data={data?.topByMeetings ?? []} layout="vertical" margin={{ left: 0, right: 8 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <Tooltip />
                <Bar dataKey="count" fill="#b08964" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
            {(data?.topByMeetings ?? []).length === 0 && (
              <p className="text-center text-sm text-text-muted">אין נתונים עדיין</p>
            )}
          </ChartCard>
        </div>

        {/* Customers by area */}
        <ChartCard title="לקוחות לפי אזור החתונה">
          {(data?.customersByArea ?? []).length === 0 ? (
            <p className="text-sm text-text-muted text-center py-6">אין נתונים עדיין</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.customersByArea ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="area" tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </AdminLayout>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <h3 className="font-bold text-text-main mb-4">{title}</h3>
      {children}
    </div>
  );
}

function DateTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: string; count: number } }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const d = new Date(p.date);
  return (
    <div className="bg-white shadow-lg border border-border rounded-lg px-3 py-2 text-xs">
      <div className="font-semibold text-text-main">{d.toLocaleDateString("he-IL", { day: "numeric", month: "short" })}</div>
      <div className="text-text-muted">{p.count}</div>
    </div>
  );
}

