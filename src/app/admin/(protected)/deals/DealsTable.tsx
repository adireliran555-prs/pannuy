"use client";

import { useState } from "react";
import { formatRelativeHebrew } from "@/lib/utils";
import { CATEGORY_LABELS_SINGULAR } from "@/lib/categories";

type Status = "REPORTED" | "VERIFIED" | "DISPUTED";

interface Row {
  id: string;
  supplierName: string;
  supplierPhone: string;
  category: string;
  customerName: string | null;
  customerPhone: string | null;
  matched: boolean;
  referralId: string | null;
  eventDate: string | null;
  amountIls: number;
  commissionIls: number;
  status: Status;
  note: string | null;
  createdAt: string;
}

const STATUS: Record<Status, { label: string; cls: string }> = {
  REPORTED: { label: "דווח", cls: "bg-amber-50 text-amber-700" },
  VERIFIED: { label: "אומת", cls: "bg-green-50 text-green-700" },
  DISPUTED: { label: "במחלוקת", cls: "bg-red-50 text-red-700" },
};

const ils = (n: number) => `₪${n.toLocaleString("he-IL")}`;

export default function DealsTable({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [busyId, setBusyId] = useState<string | null>(null);

  const setStatus = async (id: string, status: Status) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return;
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    } finally {
      setBusyId(null);
    }
  };

  if (rows.length === 0) {
    return <p className="text-text-muted text-sm bg-white rounded-2xl border border-border p-8 text-center">אין עסקאות שדווחו עדיין</p>;
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface text-text-muted text-xs">
          <tr>
            <th className="text-start px-4 py-3 font-semibold">ספק</th>
            <th className="text-start px-4 py-3 font-semibold">לקוח</th>
            <th className="text-start px-4 py-3 font-semibold">אירוע</th>
            <th className="text-start px-4 py-3 font-semibold">עסקה</th>
            <th className="text-start px-4 py-3 font-semibold">עמלה</th>
            <th className="text-start px-4 py-3 font-semibold">סטטוס</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3">
                <p className="font-semibold text-text-main">{r.supplierName}</p>
                <p className="text-xs text-text-muted">{CATEGORY_LABELS_SINGULAR[r.category] ?? r.category}</p>
                <p dir="ltr" className="text-xs text-text-muted text-start">{r.supplierPhone}</p>
              </td>
              <td className="px-4 py-3">
                <p className="text-text-main">{r.customerName ?? "—"}</p>
                {r.customerPhone && <p dir="ltr" className="text-xs text-text-muted text-start">{r.customerPhone}</p>}
                <p className="text-[11px] text-text-muted">
                  {r.matched ? (r.referralId ? "לקוח רשום · הפניה מהאתר" : "לקוח רשום · ללא הפניה") : "לא נמצא במערכת"}
                </p>
              </td>
              <td className="px-4 py-3 text-text-main whitespace-nowrap">
                <p dir="ltr" className="text-start">{r.eventDate ?? "—"}</p>
                <p className="text-[11px] text-text-muted">דווח {formatRelativeHebrew(new Date(r.createdAt))}</p>
              </td>
              <td className="px-4 py-3 font-semibold text-text-main">{ils(r.amountIls)}</td>
              <td className="px-4 py-3 text-green-700 font-semibold">{ils(r.commissionIls)}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                {r.note && <p className="text-[11px] text-text-muted mt-1 max-w-[200px] truncate" title={r.note}>{r.note}</p>}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2 justify-end whitespace-nowrap">
                  {r.status !== "VERIFIED" && (
                    <button disabled={busyId === r.id} onClick={() => setStatus(r.id, "VERIFIED")} className="text-xs font-semibold text-white bg-green-600 px-3 py-1.5 rounded-lg disabled:opacity-50">אמת</button>
                  )}
                  {r.status !== "DISPUTED" && (
                    <button disabled={busyId === r.id} onClick={() => setStatus(r.id, "DISPUTED")} className="text-xs font-semibold text-red-700 bg-red-50 px-3 py-1.5 rounded-lg disabled:opacity-50">במחלוקת</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
