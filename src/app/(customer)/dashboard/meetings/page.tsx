"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Video, Phone, Users, Clock, CheckCircle, XCircle, AlertCircle, ClipboardList } from "lucide-react";
import DashboardLayout from "@/components/common/DashboardLayout";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMeetings } from "@/hooks/useMeetings";
import { useEvent } from "@/hooks/useEvent";
import { formatHebrewDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Tab = "upcoming" | "past" | "cancelled";

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

const STATUS_CONFIG = {
  PENDING: {
    label: "ממתין לאישור",
    variant: "warning" as const,
    icon: Clock,
  },
  CONFIRMED: {
    label: "מאושר",
    variant: "success" as const,
    icon: CheckCircle,
  },
  COMPLETED: {
    label: "הושלם",
    variant: "info" as const,
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "בוטל",
    variant: "default" as const,
    icon: XCircle,
  },
  REJECTED: {
    label: "נדחה",
    variant: "default" as const,
    icon: XCircle,
  },
};

export default function MeetingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [cancelError, setCancelError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { upcoming, past, cancelled, isLoading, mutate } = useMeetings();
  const { event } = useEvent();
  const hasActivePlan = event != null;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "upcoming", label: "קרובות", count: upcoming.length },
    { id: "past", label: "עבר", count: past.length },
    { id: "cancelled", label: "בוטלו", count: cancelled.length },
  ];

  const getMeetings = () => {
    if (activeTab === "upcoming") return upcoming;
    if (activeTab === "past") return past;
    return cancelled;
  };

  const meetings = getMeetings();

  const handleCancel = async (id: string) => {
    setCancelError("");
    setCancellingId(id);
    try {
      const res = await fetch(`/api/meetings/${id}/cancel`, { method: "PATCH" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setCancelError(json?.error ?? "ביטול הפגישה נכשל. נסו שנית.");
        return;
      }
      mutate();
    } catch {
      setCancelError("ביטול הפגישה נכשל. נסו שנית.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-text-main">
            הפגישות שלי
          </h1>
          <p className="text-text-muted text-sm mt-1">
            נהלו את כל הפגישות עם הספקים
          </p>
        </div>

        {/* Back to the active event plan */}
        {hasActivePlan && (
          <Link
            href="/plan"
            className="flex items-center justify-between gap-3 bg-primary-light border border-primary/20 rounded-2xl px-4 py-3.5 transition-colors hover:bg-primary-light/70"
          >
            <span className="flex items-center gap-2.5 text-primary-dark font-semibold">
              <ClipboardList className="h-5 w-5 flex-shrink-0" />
              חזרה לתוכנית האירוע
            </span>
            <span className="text-primary-dark text-sm">‹</span>
          </Link>
        )}

        {/* Cancel error */}
        {cancelError && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-semibold">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {cancelError}
          </div>
        )}

        {/* Tabs — sticky. Solid opaque background so scrolled list content
            never bleeds through, with a subtle bottom border + shadow. */}
        <div className="sticky top-0 sm:top-16 z-30 -mx-4 border-b border-border bg-surface px-4 pb-3 pt-2 shadow-sm sm:-mx-6 sm:px-6">
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
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    "text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold",
                    activeTab === id
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
        </div>

        {/* Meetings list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-border p-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <EmptyState
            emoji={activeTab === "upcoming" ? "📅" : activeTab === "past" ? "✅" : "❌"}
            title={
              activeTab === "upcoming"
                ? "אין פגישות קרובות"
                : activeTab === "past"
                ? "אין פגישות שהסתיימו"
                : "אין פגישות שבוטלו"
            }
            description={
              activeTab === "upcoming"
                ? "קבעו פגישה עם ספק שאהבתם"
                : undefined
            }
            ctaLabel={activeTab === "upcoming" ? "חפשו ספקים" : undefined}
            onCta={
              activeTab === "upcoming"
                ? () => (window.location.href = "/search")
                : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {meetings.map((meeting: any) => {
              const TypeIcon = MEETING_TYPE_ICONS[meeting.meetingType] || Video;
              const statusCfg =
                STATUS_CONFIG[meeting.status as keyof typeof STATUS_CONFIG] ||
                STATUS_CONFIG.PENDING;
              const StatusIcon = statusCfg.icon;
              const supplierPhoto = meeting.supplier?.photos?.[0]?.cloudinaryUrl;

              return (
                <div
                  key={meeting.id}
                  className="bg-white rounded-2xl border border-border p-5 transition-all hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <Link
                      href={`/suppliers/${meeting.supplier.slug}`}
                      className="flex-shrink-0"
                    >
                      <div className="relative w-14 h-14 rounded-full overflow-hidden bg-primary-light">
                        {supplierPhoto ? (
                          <Image
                            src={supplierPhoto}
                            alt={meeting.supplier.name}
                            fill
                            className="object-cover"

                          />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-primary font-black text-xl">
                            {meeting.supplier.name?.charAt(0) ?? "?"}
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <Link
                          href={`/suppliers/${meeting.supplier.slug}`}
                          className="font-bold text-text-main hover:text-primary transition-colors"
                        >
                          {meeting.supplier.name}
                        </Link>
                        <Badge variant={statusCfg.variant} size="sm">
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatHebrewDate(meeting.requestedDate)}
                        </span>
                        <span className="flex items-center gap-1 ltr">
                          <Clock className="h-3.5 w-3.5" />
                          {meeting.startTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <TypeIcon className="h-3.5 w-3.5" />
                          {MEETING_TYPE_LABELS[meeting.meetingType] ?? meeting.meetingType}
                        </span>
                      </div>

                      {meeting.customerNotes && (
                        <p className="mt-2 text-sm text-text-muted bg-surface rounded-lg px-3 py-2 border border-border/50">
                          {meeting.customerNotes}
                        </p>
                      )}

                      <div className="flex gap-2 mt-3">
                        {(meeting.status === "PENDING" || meeting.status === "CONFIRMED") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(meeting.id)}
                            isLoading={cancellingId === meeting.id}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            בטלו פגישה
                          </Button>
                        )}
                        <Link href={`/suppliers/${meeting.supplier.slug}`}>
                          <Button variant="ghost" size="sm">
                            צפו בפרופיל
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA if no upcoming meetings. With an active plan the search box is
            demoted to a small secondary line — the plan is the main path.
            Without a plan, keep the big central discovery card. */}
        {activeTab === "upcoming" && !isLoading && meetings.length === 0 && (
          hasActivePlan ? (
            <p className="text-center text-sm text-text-muted">
              רוצים להוסיף ספק?{" "}
              <Link
                href="/search"
                className="font-semibold text-primary hover:text-primary-dark"
              >
                גלו ספקים פנויים
              </Link>
            </p>
          ) : (
            <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-6 text-center border border-border">
              <p className="text-text-main font-semibold mb-2">
                מוכנים להתחיל לחפש? 📸
              </p>
              <p className="text-text-muted text-sm mb-4">
                גלו ספקים פנויים בתאריך ובאזור שלכם
              </p>
              <Link href="/search">
                <Button>גלו ספקים</Button>
              </Link>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
}
