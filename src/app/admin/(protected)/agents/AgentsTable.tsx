"use client";

import { useState } from "react";
import { formatRelativeHebrew } from "@/lib/utils";

interface Row {
  id: string;
  name: string;
  phone: string;
  referralCode: string;
  isActive: boolean;
  createdAt: string;
  referredCustomers: number;
  referredSuppliers: number;
  pending: number;
  confirmed: number;
  paid: number;
}

const ils = (n: number) => `₪${n.toLocaleString("he-IL")}`;

export default function AgentsTable({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [busyId, setBusyId] = useState<string | null>(null);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return;
      setRows((rs) =>
        rs.map((r) => {
          if (r.id !== id) return r;
          if ("isActive" in body) return { ...r, isActive: body.isActive as boolean };
          if (body.markPaid) return { ...r, paid: r.paid + r.confirmed, confirmed: 0 };
          return r;
        })
      );
    } finally {
      setBusyId(null);
    }
  };

  if (rows.length === 0) {
    return <p className="text-text-muted text-sm bg-white rounded-2xl border border-border p-8 text-center">אין סוכנים עדיין</p>;
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface text-text-muted text-xs">
          <tr>
            <th className="text-start px-4 py-3 font-semibold">סוכן</th>
            <th className="text-start px-4 py-3 font-semibold">קוד</th>
            <th className="text-start px-4 py-3 font-semibold">הפניות</th>
            <th className="text-start px-4 py-3 font-semibold">ממתין</th>
            <th className="text-start px-4 py-3 font-semibold">לתשלום</th>
            <th className="text-start px-4 py-3 font-semibold">שולם</th>
            <th className="text-start px-4 py-3 font-semibold">סטטוס</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id} className={r.isActive ? "" : "opacity-60"}>
              <td className="px-4 py-3">
                <p className="font-semibold text-text-main">{r.name}</p>
                <p dir="ltr" className="text-xs text-text-muted text-start">{r.phone}</p>
                <p className="text-[11px] text-text-muted">נרשם {formatRelativeHebrew(new Date(r.createdAt))}</p>
              </td>
              <td className="px-4 py-3 font-mono text-xs" dir="ltr">{r.referralCode}</td>
              <td className="px-4 py-3 text-text-main whitespace-nowrap">
                {r.referredCustomers} לקוחות · {r.referredSuppliers} ספקים
              </td>
              <td className="px-4 py-3 text-amber-700">{ils(r.pending)}</td>
              <td className="px-4 py-3 text-green-700 font-semibold">{ils(r.confirmed)}</td>
              <td className="px-4 py-3 text-text-muted">{ils(r.paid)}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {r.isActive ? "פעיל" : "מושבת"}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2 justify-end whitespace-nowrap">
                  {r.confirmed > 0 && (
                    <button
                      disabled={busyId === r.id}
                      onClick={() => patch(r.id, { markPaid: true })}
                      className="text-xs font-semibold text-white bg-primary px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      סמן כשולם
                    </button>
                  )}
                  <button
                    disabled={busyId === r.id}
                    onClick={() => patch(r.id, { isActive: !r.isActive })}
                    className="text-xs font-semibold text-text-main border border-border px-3 py-1.5 rounded-lg disabled:opacity-50"
                  >
                    {r.isActive ? "השבתה" : "הפעלה"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
