"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, ShieldCheck, Search, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { EvidenceRow } from "@/lib/evidence-query";

const TYPE_LABEL: Record<string, string> = {
  PROFILE_VIEW: "צפייה בפרופיל",
  SUPPLIER_CONTACT_EXPOSED: "טלפון הספק נחשף ללקוח",
  CUSTOMER_CONTACT_EXPOSED: "טלפון הלקוח נחשף לספק",
  WHATSAPP_TAP: "לחיצה על וואטסאפ",
  SUPPLIER_SAVED: "ספק נשמר",
  SUPPLIER_UNSAVED: "ספק הוסר מהשמורים",
  MEETING_REQUESTED: "בקשת פגישה",
  MEETING_CONFIRMED: "פגישה אושרה",
  MEETING_REJECTED: "פגישה נדחתה",
  MEETING_CANCELLED: "פגישה בוטלה",
  MEETING_COMPLETED: "אירוע הושלם",
  REVIEW_CREATED: "ביקורת נכתבה",
  REFERRAL_FOLLOWUP_SENT: "תזכורת ללקוח נשלחה",
  CUSTOMER_OUTCOME_REPORTED: "הלקוח דיווח על תוצאה",
  DEAL_REPORTED: "הספק דיווח על עסקה",
  DEAL_REPORT_STATUS_CHANGED: "סטטוס דיווח עסקה שונה",
  CUSTOMER_LOGIN: "התחברות לקוח",
  SUPPLIER_LOGIN: "התחברות ספק",
  SUPPLIER_PROFILE_UPDATED: "פרופיל ספק עודכן",
  ADMIN_ACTION: "פעולת אדמין",
  AGENT_EARNING_CREATED: "עמלת סוכן נוצרה",
};

const ACTOR_LABEL: Record<string, string> = {
  customer: "לקוח",
  supplier: "ספק",
  admin: "אדמין",
  agent: "סוכן",
  system: "מערכת",
  anonymous: "אנונימי",
};

const EXPOSURE_TYPES = new Set(["SUPPLIER_CONTACT_EXPOSED", "CUSTOMER_CONTACT_EXPOSED", "WHATSAPP_TAP"]);

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "medium" });
}

interface Filters {
  customerId: string;
  supplierId: string;
  customer: string;
  supplier: string;
  type: string;
  from: string;
  to: string;
}

function toQuery(f: Filters, extra?: Record<string, string>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...f, ...(extra ?? {}) })) if (v) sp.set(k, v);
  return sp.toString();
}

export default function EvidenceExplorer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>({
    customerId: searchParams.get("customerId") ?? "",
    supplierId: searchParams.get("supplierId") ?? "",
    customer: searchParams.get("customer") ?? "",
    supplier: searchParams.get("supplier") ?? "",
    type: searchParams.get("type") ?? "",
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
  });
  const [rows, setRows] = useState<EvidenceRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [verify, setVerify] = useState<{ ok: boolean; checked: number; brokenAtSeq?: string } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const load = useCallback(
    async (f: Filters, cursor?: string | null) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/evidence?${toQuery(f, cursor ? { cursor } : undefined)}`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error ?? "שגיאה");
        setRows((prev) => (cursor ? [...prev, ...json.data.rows] : json.data.rows));
        setNextCursor(json.data.nextCursor);
      } catch (e) {
        setError(e instanceof Error ? e.message : "שגיאה בטעינה");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial fetch — SWR-style: a microtask so the effect itself does not set state.
  useEffect(() => {
    const t = setTimeout(() => void load(filters), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => {
    router.replace(`/admin/evidence?${toQuery(filters)}`);
    void load(filters);
  };

  const clearPair = () => {
    const f = { ...filters, customerId: "", supplierId: "" };
    setFilters(f);
    router.replace(`/admin/evidence?${toQuery(f)}`);
    void load(f);
  };

  const runVerify = async () => {
    setVerifying(true);
    setVerify(null);
    try {
      const res = await fetch("/api/admin/evidence/verify");
      const json = await res.json();
      if (json.success) setVerify(json.data);
      else setError(json.error ?? "שגיאה באימות");
    } finally {
      setVerifying(false);
    }
  };

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pairLocked = Boolean(filters.customerId || filters.supplierId);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
        {pairLocked && (
          <div className="flex flex-wrap items-center gap-2 text-xs bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <span className="font-semibold text-amber-800">מסונן לזוג לקוח↔ספק ספציפי</span>
            {rows[0]?.customerName && <span>לקוח: {rows[0].customerName}</span>}
            {rows[0]?.supplierName && <span>ספק: {rows[0].supplierName}</span>}
            <button type="button" onClick={clearPair} className="text-primary underline ms-auto">
              נקו סינון זוג
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          <input
            className="rounded-xl border border-border px-3 py-2 text-sm"
            placeholder="לקוח: שם או טלפון"
            value={filters.customer}
            onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
          />
          <input
            className="rounded-xl border border-border px-3 py-2 text-sm"
            placeholder="ספק: שם / slug / טלפון"
            value={filters.supplier}
            onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
          />
          <select
            className="rounded-xl border border-border px-3 py-2 text-sm bg-white"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">כל סוגי האירועים</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input
            type="date"
            dir="ltr"
            className="rounded-xl border border-border px-3 py-2 text-sm"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            aria-label="מתאריך"
          />
          <input
            type="date"
            dir="ltr"
            className="rounded-xl border border-border px-3 py-2 text-sm"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            aria-label="עד תאריך"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={applyFilters} isLoading={loading}>
            <Search className="h-4 w-4" />
            חיפוש
          </Button>
          <a
            href={`/api/admin/evidence/export?${toQuery(filters)}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-sm font-semibold hover:bg-surface"
          >
            <Download className="h-4 w-4" />
            ייצוא CSV
          </a>
          <Button size="sm" variant="secondary" onClick={runVerify} isLoading={verifying}>
            <ShieldCheck className="h-4 w-4" />
            בדיקת שלמות השרשרת
          </Button>
          {verify && (
            <span
              className={cn(
                "inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-bold",
                verify.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
              )}
            >
              {verify.ok
                ? `השרשרת תקינה — ${verify.checked.toLocaleString("he-IL")} רשומות אומתו`
                : `שרשרת שבורה ברשומה מס׳ ${verify.brokenAtSeq} (אומתו ${verify.checked})`}
            </span>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {rows.length === 0 && !loading ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center text-text-muted">
          אין אירועים לסינון הזה.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border divide-y divide-border">
          {rows.map((r) => {
            const open = expanded.has(r.id);
            const exposure = EXPOSURE_TYPES.has(r.type);
            return (
              <div key={r.id} className="px-4 py-3">
                <button type="button" onClick={() => toggle(r.id)} className="w-full text-start">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xs text-text-muted whitespace-nowrap" dir="ltr">
                      {formatDateTime(r.createdAt)}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-bold rounded-full px-2 py-0.5",
                        exposure
                          ? "bg-amber-100 text-amber-800"
                          : r.type === "ADMIN_ACTION"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-surface text-text-main"
                      )}
                    >
                      {TYPE_LABEL[r.type] ?? r.type}
                    </span>
                    <span className="text-xs text-text-muted">{ACTOR_LABEL[r.actorType] ?? r.actorType}</span>
                    {r.customerName && (
                      <span className="text-sm">
                        לקוח: <strong>{r.customerName}</strong>
                        {r.customerPhone && (
                          <span className="text-text-muted" dir="ltr">
                            {" "}
                            {r.customerPhone}
                          </span>
                        )}
                      </span>
                    )}
                    {r.supplierName && (
                      <span className="text-sm">
                        ספק: <strong>{r.supplierName}</strong>
                      </span>
                    )}
                    <span className="ms-auto text-text-muted">
                      {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  </div>
                </button>
                {open && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <div>
                        <span className="text-text-muted">מס׳ רשומה:</span> <span dir="ltr">{r.seq}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">IP:</span> <span dir="ltr">{r.ip ?? "—"}</span>
                      </div>
                      <div className="break-all">
                        <span className="text-text-muted">דפדפן:</span> <span dir="ltr">{r.userAgent ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">מזהה סשן:</span> <span dir="ltr">{r.sessionId ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">יעד:</span> {r.targetType ?? "—"}{" "}
                        <span dir="ltr">{r.targetId ?? ""}</span>
                      </div>
                      <div className="break-all">
                        <span className="text-text-muted">hash:</span> <span dir="ltr">{r.hash}</span>
                      </div>
                    </div>
                    <pre
                      dir="ltr"
                      className="bg-surface rounded-xl p-3 overflow-x-auto text-[11px] leading-relaxed max-h-64"
                    >
                      {JSON.stringify(r.payload ?? {}, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
          {nextCursor && (
            <div className="p-4 text-center">
              <Button size="sm" variant="secondary" onClick={() => load(filters, nextCursor)} isLoading={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                טענו עוד
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
