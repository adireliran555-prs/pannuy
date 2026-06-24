"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Check, X, ExternalLink, LogIn, AlertTriangle, ChevronDown, Save, Trash2 } from "lucide-react";
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
  warningCount: number;
  highlights: string[];
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const impersonate = async (id: string) => {
    setBusyId(id);
    const res = await fetch(`/api/admin/impersonate/supplier/${id}`, { method: "POST" });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j.redirect) window.location.href = j.redirect;
    else setBusyId(null);
  };

  const issueWarning = async (id: string) => {
    const reasonHe = window.prompt("סיבת האזהרה (תוצג לספק):");
    if (!reasonHe || !reasonHe.trim()) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/suppliers/${id}/warning`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reasonHe: reasonHe.trim() }),
    });
    const j = await res.json().catch(() => ({}));
    setBusyId(null);
    if (res.ok) {
      setRows((rs) =>
        rs.map((r) =>
          r.id === id
            ? { ...r, warningCount: j.warningCount ?? r.warningCount + 1, isActive: j.deactivated ? false : r.isActive }
            : r
        )
      );
      router.refresh();
    }
  };

  const saveHighlights = async (id: string, lines: string[]) => {
    setBusyId(id);
    const res = await fetch(`/api/admin/suppliers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ highlights: lines }),
    });
    setBusyId(null);
    if (res.ok) {
      const cleaned = lines.map((l) => l.trim()).filter((l) => l.length > 0);
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, highlights: cleaned } : r)));
      router.refresh();
    }
  };

  const removeSupplier = async (id: string, name: string) => {
    if (
      !window.confirm(
        `למחוק לצמיתות את הספק "${name}"?\n\nיפוגו גם פגישות, ביקורות ונתונים קשורים. לא ניתן לשחזר.`
      )
    ) {
      return;
    }
    setBusyId(id);
    const res = await fetch(`/api/admin/suppliers/${id}`, { method: "DELETE" });
    const j = await res.json().catch(() => ({}));
    setBusyId(null);
    if (res.ok) {
      setRows((rs) => rs.filter((r) => r.id !== id));
      setExpandedId(null);
      router.refresh();
      return;
    }
    window.alert(typeof j.error === "string" ? j.error : "מחיקה נכשלה");
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
                <th className="px-4 py-3 text-start">פגישות</th>
                <th className="px-4 py-3 text-start">צפיות</th>
                <th className="px-4 py-3 text-start">סטטוס</th>
                <th className="px-4 py-3 text-start">תאריך הצטרפות</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-text-muted">לא נמצאו ספקים</td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <FragmentRow key={r.id}>
                  <tr className="hover:bg-surface/50">
                    <td className="px-4 py-3 font-semibold text-text-main">
                      <div>{r.name}</div>
                      <div className="text-xs text-text-muted" dir="ltr">{r.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{r.categoryLabel}</td>
                    <td className="px-4 py-3 text-text-muted">{r.city}</td>
                    <td className="px-4 py-3 text-text-muted">{r.meetings}</td>
                    <td className="px-4 py-3 text-text-muted">{r.views}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Pill on={r.isVerified} onClick={() => toggle(r.id, "isVerified", !r.isVerified)} disabled={busyId === r.id} onLabel="מאומת" offLabel="לא מאומת" />
                        <Pill on={r.isActive} onClick={() => toggle(r.id, "isActive", !r.isActive)} disabled={busyId === r.id} onLabel="פעיל" offLabel="כבוי" greenWhenOn />
                        {r.warningCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-red-50 text-red-700 border-red-200">
                            <AlertTriangle className="h-3 w-3" />
                            {r.warningCount} אזהרות
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                      {formatRelativeHebrew(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Link
                          href={`/suppliers/${r.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:text-primary-dark"
                        >
                          <ExternalLink className="h-3 w-3" />
                          פרופיל
                        </Link>
                        <button
                          onClick={() => impersonate(r.id)}
                          disabled={busyId === r.id}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-primary disabled:opacity-50"
                        >
                          <LogIn className="h-3 w-3" />
                          צפו כספק
                        </button>
                        <button
                          onClick={() => setExpandedId((id) => (id === r.id ? null : r.id))}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-primary"
                        >
                          <ChevronDown className={cn("h-3 w-3 transition-transform", expandedId === r.id && "rotate-180")} />
                          ניהול
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === r.id && (
                    <tr className="bg-surface/40">
                      <td colSpan={8} className="px-4 py-4">
                        <SupplierDetail
                          row={r}
                          busy={busyId === r.id}
                          onWarn={() => issueWarning(r.id)}
                          onSaveHighlights={(lines) => saveHighlights(r.id, lines)}
                          onDelete={() => removeSupplier(r.id, r.name)}
                        />
                      </td>
                    </tr>
                  )}
                  </FragmentRow>
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

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <Fragment>{children}</Fragment>;
}

function SupplierDetail({
  row,
  busy,
  onWarn,
  onSaveHighlights,
  onDelete,
}: {
  row: Row;
  busy: boolean;
  onWarn: () => void;
  onSaveHighlights: (lines: string[]) => void;
  onDelete: () => void;
}) {
  const [text, setText] = useState(row.highlights.join("\n"));
  const dirty = text !== row.highlights.join("\n");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Warnings */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-text-main">אזהרות</h4>
          <span className="text-xs text-text-muted">{row.warningCount} עד כה</span>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          הוצאת אזהרה תירשם ותוצג לספק. שתי אזהרות יכבו את הספק אוטומטית.
        </p>
        <button
          onClick={onWarn}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          <AlertTriangle className="h-4 w-4" />
          הוצא אזהרה
        </button>
      </div>

      {/* Highlights */}
      <div className="space-y-2">
        <h4 className="font-bold text-sm text-text-main">נקודות חוזק</h4>
        <p className="text-xs text-text-muted">נקודת חוזק אחת בכל שורה.</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          dir="rtl"
          className="w-full p-3 rounded-xl border-2 border-border focus:border-primary outline-none text-sm bg-white resize-y"
          placeholder={"לדוגמה:\nשירות מהיר ואדיב\nניסיון של מעל 10 שנים"}
        />
        <button
          onClick={() => onSaveHighlights(text.split("\n"))}
          disabled={busy || !dirty}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border-2 border-primary bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          שמירה
        </button>
      </div>

      {/* Delete */}
      <div className="space-y-2">
        <h4 className="font-bold text-sm text-text-main">מחיקת ספק</h4>
        <p className="text-xs text-text-muted leading-relaxed">
          מוחק את הספק לצמיתות מהמערכת, כולל פגישות, ביקורות ותמונות. לא ניתן לשחזר.
        </p>
        <button
          onClick={onDelete}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border-2 border-red-300 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          מחק ספק
        </button>
      </div>
    </div>
  );
}

