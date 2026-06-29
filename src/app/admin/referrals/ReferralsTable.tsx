"use client";

import { useState } from "react";
import { Phone, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  status: string;
  channel: string;
  followUpCount: number;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  supplierName: string;
  supplierSlug: string;
  hasMeeting: boolean;
  adminNotes: string;
}

const STATUS_OPTIONS = [
  "NEW",
  "AWAITING_REPLY",
  "CONNECTED",
  "NO_ANSWER",
  "CONVERTED",
  "LOST",
] as const;

const STATUS_LABEL: Record<string, string> = {
  NEW: "חדש",
  AWAITING_REPLY: "ממתין לתשובה",
  CONNECTED: "נוצר קשר",
  NO_ANSWER: "אין מענה — להתקשר",
  CONVERTED: "הומר להזמנה",
  LOST: "אבוד",
};

const STATUS_COLOR: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  AWAITING_REPLY: "bg-amber-50 text-amber-700 border-amber-200",
  CONNECTED: "bg-green-50 text-green-700 border-green-200",
  NO_ANSWER: "bg-red-50 text-red-700 border-red-200",
  CONVERTED: "bg-primary/10 text-primary border-primary/20",
  LOST: "bg-gray-100 text-gray-500 border-gray-200",
};

const CHANNEL_LABEL: Record<string, string> = {
  IN_APP: "באתר",
  WHATSAPP: "וואטסאפ",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function ReferralsTable({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [savingId, setSavingId] = useState<string | null>(null);

  const patch = async (id: string, data: { status?: string; adminNotes?: string }) => {
    setSavingId(id);
    try {
      await fetch(`/api/admin/referrals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } finally {
      setSavingId(null);
    }
  };

  const onStatusChange = (id: string, status: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    patch(id, { status });
  };

  const onNotesChange = (id: string, adminNotes: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, adminNotes } : r)));
  };

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border p-10 text-center text-text-muted">
        עדיין אין הפניות.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-x-auto">
      <table className="w-full text-sm text-right">
        <thead className="bg-surface text-text-muted text-xs">
          <tr>
            <th className="px-4 py-3 font-semibold">לקוח</th>
            <th className="px-4 py-3 font-semibold">ספק</th>
            <th className="px-4 py-3 font-semibold">ערוץ</th>
            <th className="px-4 py-3 font-semibold">סטטוס</th>
            <th className="px-4 py-3 font-semibold">תזכורות</th>
            <th className="px-4 py-3 font-semibold">תאריך</th>
            <th className="px-4 py-3 font-semibold">הערות</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id} className={cn(savingId === r.id && "opacity-60")}>
              <td className="px-4 py-3">
                <div className="font-semibold text-text-main">{r.customerName}</div>
                {r.customerPhone && (
                  <a
                    href={`tel:${r.customerPhone}`}
                    className="inline-flex items-center gap-1 text-xs text-primary mt-0.5"
                  >
                    <Phone className="h-3 w-3" />
                    {r.customerPhone}
                  </a>
                )}
              </td>
              <td className="px-4 py-3">
                {r.supplierSlug ? (
                  <a
                    href={`/suppliers/${r.supplierSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-text-main hover:text-primary"
                  >
                    {r.supplierName}
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                ) : (
                  r.supplierName
                )}
                {r.hasMeeting && (
                  <div className="text-[10px] text-green-700 mt-0.5">כולל בקשת פגישה</div>
                )}
              </td>
              <td className="px-4 py-3 text-text-muted">{CHANNEL_LABEL[r.channel] ?? r.channel}</td>
              <td className="px-4 py-3">
                <select
                  value={r.status}
                  onChange={(e) => onStatusChange(r.id, e.target.value)}
                  className={cn(
                    "rounded-lg border text-xs font-semibold px-2 py-1.5 outline-none cursor-pointer",
                    STATUS_COLOR[r.status] ?? "border-border"
                  )}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-center text-text-muted">{r.followUpCount}</td>
              <td className="px-4 py-3 text-text-muted whitespace-nowrap">{formatDate(r.createdAt)}</td>
              <td className="px-4 py-3 min-w-[180px]">
                <input
                  type="text"
                  value={r.adminNotes}
                  onChange={(e) => onNotesChange(r.id, e.target.value)}
                  onBlur={(e) => patch(r.id, { adminNotes: e.target.value })}
                  placeholder="הוסיפו הערה…"
                  className="w-full rounded-lg border border-border px-2 py-1.5 text-xs outline-none focus:border-primary"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
