"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Check, X, ExternalLink } from "lucide-react";
import { cn, formatRelativeHebrew } from "@/lib/utils";

interface Row {
  id: string;
  slug: string;
  name: string;
  phone: string;
  city: string;
  categoryLabel: string;
  rating: number;
  ratingCount: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  meetings: number;
  views: number;
}

export default function SuppliersTable({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "unverified" | "inactive">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = rows.filter((r) => {
    if (q && !`${r.name} ${r.city} ${r.phone}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "verified" && !r.isVerified) return false;
    if (filter === "unverified" && r.isVerified) return false;
    if (filter === "inactive" && r.isActive) return false;
    return true;
  });

  const toggle = async (id: string, field: "isVerified" | "isActive", value: boolean) => {
    setBusyId(id);
    const res = await fetch(`/api/admin/suppliers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setBusyId(null);
    if (res.ok) {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
      router.refresh();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש לפי שם, עיר, טלפון..."
            className="w-full ps-4 pe-9 py-2.5 rounded-xl border-2 border-border focus:border-primary outline-none text-sm bg-white"
          />
        </div>
        {([
          ["all", "הכל"],
          ["verified", "מאומתים"],
          ["unverified", "לא מאומתים"],
          ["inactive", "לא פעילים"],
        ] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors",
              filter === k
                ? "border-primary bg-primary text-white"
                : "border-border bg-white text-text-main hover:border-primary"
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-start">שם</th>
                <th className="px-4 py-3 text-start">קטגוריה</th>
                <th className="px-4 py-3 text-start">עיר</th>
                <th className="px-4 py-3 text-start">דירוג</th>
                <th className="px-4 py-3 text-start">פגישות</th>
                <th className="px-4 py-3 text-start">צפיות</th>
                <th className="px-4 py-3 text-start">סטטוס</th>
                <th className="px-4 py-3 text-start">הצטרפ.ה</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-text-muted">לא נמצאו ספקים</td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-surface/50">
                    <td className="px-4 py-3 font-semibold text-text-main">
                      <div>{r.name}</div>
                      <div className="text-xs text-text-muted" dir="ltr">{r.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{r.categoryLabel}</td>
                    <td className="px-4 py-3 text-text-muted">{r.city}</td>
                    <td className="px-4 py-3">
                      {r.ratingCount > 0 ? (
                        <span className="font-bold">⭐ {r.rating.toFixed(1)} <span className="text-text-muted font-normal">({r.ratingCount})</span></span>
                      ) : <span className="text-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{r.meetings}</td>
                    <td className="px-4 py-3 text-text-muted">{r.views}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Pill on={r.isVerified} onClick={() => toggle(r.id, "isVerified", !r.isVerified)} disabled={busyId === r.id} onLabel="מאומת" offLabel="לא מאומת" />
                        <Pill on={r.isActive} onClick={() => toggle(r.id, "isActive", !r.isActive)} disabled={busyId === r.id} onLabel="פעיל" offLabel="כבוי" greenWhenOn />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                      {formatRelativeHebrew(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/suppliers/${r.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:text-primary-dark"
                      >
                        <ExternalLink className="h-3 w-3" />
                        פרופיל
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Pill({
  on,
  onClick,
  disabled,
  onLabel,
  offLabel,
  greenWhenOn,
}: {
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
  onLabel: string;
  offLabel: string;
  greenWhenOn?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all",
        on
          ? greenWhenOn
            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
      )}
    >
      {on ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {on ? onLabel : offLabel}
    </button>
  );
}

