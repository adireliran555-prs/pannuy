"use client";

import { useState } from "react";
import useSWR from "swr";
import { Video, Phone, Users, Calendar, Clock, CheckCircle, X } from "lucide-react";
import SupplierDashboardLayout from "@/components/common/SupplierDashboardLayout";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatHebrewDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Tab = "pending" | "confirmed" | "past";

const MEETING_TYPE_ICONS: Record<string, React.ElementType> = {
  VIDEO: Video,
  PHONE: Phone,
  IN_PERSON: Users,
};

const MEETING_TYPE_LABELS: Record<string, string> = {
  VIDEO: "שיחת וידאו",
  PHONE: "שיחת טלפון",
  IN_PERSON: "פגישה פנים אל פנים",
};

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed");
  const json = await res.json();
  return json.data ?? [];
}

export default function SupplierBookingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: meetings = [], mutate, isLoading } = useSWR(
    "/api/supplier/meetings",
    fetcher,
    { revalidateOnFocus: false }
  );

  const pendingMeetings = meetings.filter((m: { status: string }) => m.status === "PENDING");
  const confirmedMeetings = meetings.filter((m: { status: string }) => m.status === "CONFIRMED");
  const pastMeetings = meetings.filter((m: { status: string }) =>
    ["COMPLETED", "REJECTED", "CANCELLED"].includes(m.status)
  );

  const getTabMeetings = () => {
    if (activeTab === "pending") return pendingMeetings;
    if (activeTab === "confirmed") return confirmedMeetings;
    return pastMeetings;
  };

  const handleAction = async (id: string, action: "confirm" | "reject") => {
    setActionLoading(id + action);
    try {
      const res = await fetch(`/api/supplier/meetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) mutate();
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "pending", label: "ממתינות", count: pendingMeetings.length },
    { id: "confirmed", label: "מאושרות", count: confirmedMeetings.length },
    { id: "past", label: "עבר", count: pastMeetings.length },
  ];

  const tabMeetings = getTabMeetings();

  return (
    <SupplierDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-text-main">ניהול פגישות</h1>
          <p className="text-text-muted text-sm mt-1">אשרו, דחו ונהלו את כל הפגישות שלכם</p>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
          {tabs.map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200",
                activeTab === id
                  ? "bg-white text-text-main shadow-sm"
                  : "text-text-muted hover:text-text-main"
              )}
            >
              {label}
              {count > 0 && (
                <span
                  className={cn(
                    "text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold",
                    activeTab === id && id === "pending"
                      ? "bg-amber-500 text-white"
                      : activeTab === id
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-text-muted"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-border p-5">
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : tabMeetings.length === 0 ? (
          <EmptyState
            emoji={activeTab === "pending" ? "⏳" : activeTab === "confirmed" ? "📅" : "✅"}
            title={
              activeTab === "pending"
                ? "אין בקשות ממתינות"
                : activeTab === "confirmed"
                ? "אין פגישות מאושרות"
                : "אין פגישות בעבר"
            }
          />
        ) : (
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {tabMeetings.map((meeting: any) => {
              const TypeIcon = MEETING_TYPE_ICONS[meeting.meetingType] || Video;
              const customerInitial = meeting.customer?.name?.charAt(0) ?? "כ";

              return (
                <div
                  key={meeting.id}
                  className="bg-white rounded-2xl border border-border p-5 space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-lg flex-shrink-0">
                      {customerInitial}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="font-bold text-text-main">
                          {meeting.customer?.name ?? "לקוח"}
                        </p>
                        {meeting.status === "PENDING" && (
                          <Badge variant="warning" size="sm">
                            <Clock className="h-3 w-3" />
                            ממתין
                          </Badge>
                        )}
                        {meeting.status === "CONFIRMED" && (
                          <Badge variant="success" size="sm">
                            <CheckCircle className="h-3 w-3" />
                            מאושר
                          </Badge>
                        )}
                        {["COMPLETED", "REJECTED", "CANCELLED"].includes(meeting.status) && (
                          <Badge variant="default" size="sm">
                            {meeting.status === "COMPLETED" ? "הושלם" : "בוטל/נדחה"}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatHebrewDate(meeting.requestedDate)}
                        </span>
                        <span className="flex items-center gap-1 ltr">
                          <Clock className="h-3.5 w-3.5 rtl" />
                          {meeting.startTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <TypeIcon className="h-3.5 w-3.5" />
                          {MEETING_TYPE_LABELS[meeting.meetingType] ?? meeting.meetingType}
                        </span>
                      </div>

                      {meeting.customerNotes && (
                        <p className="mt-2 text-sm text-text-muted bg-surface rounded-lg px-3 py-2 border border-border/50 line-clamp-2">
                          {meeting.customerNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  {meeting.status === "PENDING" && (
                    <div className="flex gap-3 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        onClick={() => handleAction(meeting.id, "confirm")}
                        isLoading={actionLoading === meeting.id + "confirm"}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        אשרו פגישה
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleAction(meeting.id, "reject")}
                        isLoading={actionLoading === meeting.id + "reject"}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                        דחי
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SupplierDashboardLayout>
  );
}
