"use client";

import { useState } from "react";
import Image from "next/image";
import { Video, Phone, Users, Calendar, Clock, CheckCircle, X } from "lucide-react";
import SupplierDashboardLayout from "@/components/common/SupplierDashboardLayout";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { MEETING_MOCK, MOCK_SUPPLIERS } from "@/lib/mock-data";
import { formatHebrewDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Tab = "pending" | "confirmed" | "past";

const MEETING_TYPE_ICONS: Record<string, React.ElementType> = {
  video: Video,
  phone: Phone,
  "in-person": Users,
};

const MEETING_TYPE_LABELS: Record<string, string> = {
  video: "שיחת וידאו",
  phone: "שיחת טלפון",
  "in-person": "פגישה פנים אל פנים",
};

export default function SupplierBookingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [meetings, setMeetings] = useState(MEETING_MOCK);

  const pendingMeetings = meetings.filter((m) => m.status === "pending");
  const confirmedMeetings = meetings.filter((m) => m.status === "confirmed");
  const pastMeetings = meetings.filter((m) => m.status === "completed");

  const getTabMeetings = () => {
    if (activeTab === "pending") return pendingMeetings;
    if (activeTab === "confirmed") return confirmedMeetings;
    return pastMeetings;
  };

  const handleConfirm = (id: string) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "confirmed" } : m))
    );
  };

  const handleReject = (id: string) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "cancelled" } : m))
    );
  };

  const handleMarkComplete = (id: string) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "completed" } : m))
    );
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-text-main">
            ניהול פגישות
          </h1>
          <p className="text-text-muted text-sm mt-1">
            אשרו, דחו ונהלו את כל הפגישות שלכם
          </p>
        </div>

        {/* Tabs */}
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

        {/* Meetings */}
        {tabMeetings.length === 0 ? (
          <EmptyState
            emoji={activeTab === "pending" ? "⏳" : activeTab === "confirmed" ? "📅" : "✅"}
            title={
              activeTab === "pending"
                ? "אין בקשות ממתינות"
                : activeTab === "confirmed"
                ? "אין פגישות מאושרות"
                : "אין פגישות שהסתיימו"
            }
          />
        ) : (
          <div className="space-y-4">
            {tabMeetings.map((meeting) => {
              const TypeIcon = MEETING_TYPE_ICONS[meeting.type] || Video;

              return (
                <div
                  key={meeting.id}
                  className="bg-white rounded-2xl border border-border p-5 space-y-4"
                >
                  <div className="flex items-start gap-4">
                    {/* Customer avatar */}
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-lg flex-shrink-0">
                      כ
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="font-bold text-text-main">
                          זוג (לקוח/ה)
                        </p>
                        {activeTab === "pending" && (
                          <Badge variant="warning" size="sm">
                            <Clock className="h-3 w-3" />
                            ממתין
                          </Badge>
                        )}
                        {activeTab === "confirmed" && (
                          <Badge variant="success" size="sm">
                            <CheckCircle className="h-3 w-3" />
                            מאושר
                          </Badge>
                        )}
                        {activeTab === "past" && (
                          <Badge variant="info" size="sm">
                            הושלם
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatHebrewDate(meeting.date)}
                        </span>
                        <span className="flex items-center gap-1 ltr">
                          <Clock className="h-3.5 w-3.5 rtl" />
                          {meeting.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <TypeIcon className="h-3.5 w-3.5" />
                          {MEETING_TYPE_LABELS[meeting.type]}
                        </span>
                      </div>

                      {meeting.notes && (
                        <p className="mt-2 text-sm text-text-muted bg-surface rounded-lg px-3 py-2 border border-border/50 line-clamp-2">
                          {meeting.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {activeTab === "pending" && (
                    <div className="flex gap-3 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(meeting.id)}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        אשרו פגישה
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReject(meeting.id)}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                        דחי
                      </Button>
                    </div>
                  )}

                  {activeTab === "confirmed" && (
                    <div className="flex gap-3 pt-2 border-t border-border">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleMarkComplete(meeting.id)}
                      >
                        סמני כהושלם
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReject(meeting.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        בטלי
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
