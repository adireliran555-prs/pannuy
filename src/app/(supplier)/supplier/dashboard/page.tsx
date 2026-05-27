"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Calendar, Clock, Star, Eye, CheckCircle, X, ArrowLeft, TrendingUp } from "lucide-react";
import SupplierDashboardLayout from "@/components/common/SupplierDashboardLayout";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatHebrewDate } from "@/lib/utils";

const MEETING_TYPE_LABELS: Record<string, string> = {
  VIDEO: "וידאו",
  PHONE: "טלפון",
  IN_PERSON: "פנים אל פנים",
};

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed");
  const json = await res.json();
  return json.data ?? json.supplier ?? json.user ?? null;
}

function getMeetingsThisWeek(meetings: { requestedDate: string; status: string }[]) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return meetings.filter((m) => {
    const d = new Date(m.requestedDate);
    return (
      d >= startOfWeek &&
      d < endOfWeek &&
      (m.status === "CONFIRMED" || m.status === "PENDING")
    );
  }).length;
}

export default function SupplierDashboardPage() {
  const [supplierName, setSupplierName] = useState("");

  const { data: meetings = [] } = useSWR("/api/supplier/meetings", fetcher, {
    revalidateOnFocus: false,
  });
  const { data: profile } = useSWR("/api/supplier/profile", fetcher, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    fetch("/api/supplier/auth/me")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.supplier?.name) {
          setSupplierName(json.supplier.name.split(" ")[0]);
        }
      });
  }, []);

  const pendingMeetings = meetings.filter((m: { status: string }) => m.status === "PENDING");
  const confirmedMeetings = meetings.filter((m: { status: string }) => m.status === "CONFIRMED");
  const meetingsThisWeek = getMeetingsThisWeek(meetings);

  // Profile completion
  const completionItems = [
    {
      label: "Google Calendar מחובר",
      done: !!profile?.googleRefreshToken,
    },
    {
      label: "5+ תמונות הועלו",
      done: (profile?.photos?.length ?? 0) >= 5,
    },
    {
      label: "חבילות הוגדרו",
      done: (profile?.packages?.length ?? 0) > 0,
    },
    {
      label: "ביו מלא",
      done: (profile?.bioHe?.length ?? 0) >= 20,
    },
  ];
  const completedCount = completionItems.filter((i) => i.done).length;
  const completionPct = Math.round((completedCount / completionItems.length) * 100);

  const ratingDisplay =
    profile?.ratingAvg != null ? profile.ratingAvg.toFixed(1) : "—";

  const stats = [
    {
      label: "פגישות השבוע",
      value: meetingsThisWeek.toString(),
      icon: Calendar,
      bg: "bg-primary-light",
      iconColor: "text-primary",
      valueColor: "text-primary",
    },
    {
      label: "בקשות ממתינות",
      value: pendingMeetings.length.toString(),
      icon: Clock,
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
      valueColor: "text-amber-700",
    },
    {
      label: "דירוג ממוצע",
      value: ratingDisplay,
      icon: Star,
      bg: "bg-green-50",
      iconColor: "text-green-600",
      valueColor: "text-green-700",
    },
    {
      label: "צפיות בפרופיל",
      value: "—",
      icon: Eye,
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
      valueColor: "text-blue-700",
    },
  ];

  return (
    <SupplierDashboardLayout>
      <div className="space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-main">
            שלום{supplierName ? `, ${supplierName}` : ""} 👋
          </h1>
          <p className="text-text-muted mt-1">הנה מה שמחכה לכם היום</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, bg, iconColor, valueColor }) => (
            <div key={label} className={`${bg} rounded-2xl p-4 border border-border/50`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${iconColor}`} />
                <span className="text-xs font-semibold text-text-muted">{label}</span>
              </div>
              <p className={`text-3xl font-black ${valueColor}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Pending requests */}
        {pendingMeetings.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-text-main">בקשות ממתינות</h2>
              <Link
                href="/supplier/bookings"
                className="text-sm font-semibold text-primary hover:text-primary-dark flex items-center gap-1"
              >
                ראו הכל
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {pendingMeetings.slice(0, 3).map((meeting: any) => (
                <div
                  key={meeting.id}
                  className="bg-white rounded-2xl border border-border p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold flex-shrink-0">
                    {meeting.customer?.name?.charAt(0) ?? "כ"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-main text-sm">
                      {meeting.customer?.name ?? "לקוח"} — {formatHebrewDate(meeting.requestedDate)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                      <span dir="ltr">{meeting.startTime}</span>
                      <span>·</span>
                      <span>{MEETING_TYPE_LABELS[meeting.meetingType] ?? meeting.meetingType}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href="/supplier/bookings">
                      <button className="w-9 h-9 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    </Link>
                    <Link href="/supplier/bookings">
                      <button className="w-9 h-9 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming confirmed meetings */}
        {confirmedMeetings.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-text-main">הפגישות הקרובות</h2>
              <Link
                href="/supplier/bookings"
                className="text-sm font-semibold text-primary hover:text-primary-dark flex items-center gap-1"
              >
                ראו הכל
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {confirmedMeetings.slice(0, 5).map((meeting: any, idx: number) => (
                <div
                  key={meeting.id}
                  className={`flex items-center gap-4 px-5 py-4 ${
                    idx < confirmedMeetings.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex-shrink-0 text-center min-w-[48px]">
                    <div className="text-xs font-bold text-text-muted">
                      {new Date(meeting.requestedDate).toLocaleDateString("he-IL", {
                        month: "short",
                      })}
                    </div>
                    <div className="text-xl font-black text-primary leading-none">
                      {new Date(meeting.requestedDate).getDate()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-main text-sm">
                      {meeting.customer?.name ?? "לקוח"} ·{" "}
                      {MEETING_TYPE_LABELS[meeting.meetingType] ?? meeting.meetingType}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5 ltr">{meeting.startTime}</p>
                  </div>
                  <Badge variant="success" size="sm">
                    מאושר
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Profile completion */}
        <section>
          <h2 className="text-lg font-black text-text-main mb-4">השלמת הפרופיל שלכם</h2>
          <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-text-main">
                  {completionPct}% הושלם
                </span>
                <span className="text-xs text-text-muted">
                  {completedCount}/{completionItems.length} משימות
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>

            <ul className="space-y-3">
              {completionItems.map(({ label, done }) => (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {done ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    )}
                  </div>
                  <span className={done ? "text-text-main line-through opacity-60" : "text-text-main"}>
                    {label}
                  </span>
                  {!done && (
                    <Link
                      href="/supplier/profile"
                      className="ms-auto text-xs font-semibold text-primary hover:text-primary-dark"
                    >
                      השלימי →
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            <Link href="/supplier/profile">
              <Button variant="secondary" fullWidth size="sm">
                עדכנו פרופיל
              </Button>
            </Link>
          </div>
        </section>

        {/* Analytics teaser */}
        <section>
          <div className="bg-gradient-to-br from-primary-light to-amber-50 rounded-2xl border border-primary/20 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-text-main">אנליטיקה ונתוני ביצוע</p>
              <p className="text-sm text-text-muted mt-0.5">ראו את כל הנתונים שלכם</p>
            </div>
            <Link href="/supplier/analytics">
              <Button size="sm" variant="secondary">
                אנליטיקה
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </SupplierDashboardLayout>
  );
}
