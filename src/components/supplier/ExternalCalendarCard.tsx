"use client";

import { useState } from "react";
import { Smartphone, RefreshCw, CheckCircle, Link2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type Provider = "ICLOUD" | "OUTLOOK";

const PROVIDER_LABEL: Record<Provider, string> = {
  ICLOUD: "iPhone (iCloud)",
  OUTLOOK: "Outlook",
};

const INSTRUCTIONS: Record<Provider, string[]> = {
  ICLOUD: [
    "פתחו את אפליקציית לוח השנה באייפון ולחצו על \"לוחות שנה\" בתחתית.",
    "לחצו על ⓘ ליד היומן שבו אתם מסמנים אירועים.",
    "הפעילו \"לוח שנה ציבורי\" ולחצו \"שתף קישור…\" → \"העתק\".",
    "הדביקו את הקישור (מתחיל ב־webcal://) בשדה למטה.",
  ],
  OUTLOOK: [
    "היכנסו ל־Outlook באינטרנט → הגדרות ⚙️ → לוח שנה → לוחות שנה משותפים.",
    "תחת \"פרסם לוח שנה\" בחרו את היומן והרשאת \"יכול להציג את כל הפרטים\" ולחצו \"פרסם\".",
    "העתיקו את קישור ה־ICS (לא ה־HTML).",
    "הדביקו את הקישור בשדה למטה.",
  ],
};

interface Props {
  initialProvider?: Provider | null;
  initialUrl?: string | null;
  initialSyncedAt?: string | null;
  onSynced?: () => void;
}

function formatSynced(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });
}

export default function ExternalCalendarCard({
  initialProvider,
  initialUrl,
  initialSyncedAt,
  onSynced,
}: Props) {
  const [provider, setProvider] = useState<Provider>(initialProvider ?? "ICLOUD");
  const [url, setUrl] = useState(initialUrl ?? "");
  const [connected, setConnected] = useState(!!initialUrl);
  const [syncedAt, setSyncedAt] = useState<string | null>(initialSyncedAt ?? null);
  const [busy, setBusy] = useState<"save" | "sync" | "disconnect" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showHelp, setShowHelp] = useState(!initialUrl);

  const save = async () => {
    setBusy("save");
    setMsg(null);
    try {
      const res = await fetch("/api/supplier/calendar/external", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, provider }),
      });
      const j = await res.json();
      if (res.ok && j.success) {
        setConnected(true);
        setShowHelp(false);
        setSyncedAt(new Date().toISOString());
        setMsg({ ok: true, text: `היומן חובר וסונכרן ✓ (${j.data?.synced ?? 0} אירועים)` });
        onSynced?.();
      } else {
        setMsg({ ok: false, text: j.error ?? "החיבור נכשל" });
      }
    } catch {
      setMsg({ ok: false, text: "שגיאת רשת, נסו שוב" });
    } finally {
      setBusy(null);
    }
  };

  const sync = async () => {
    setBusy("sync");
    setMsg(null);
    try {
      const res = await fetch("/api/supplier/calendar/external/sync", { method: "POST" });
      const j = await res.json();
      if (res.ok && j.success) {
        setSyncedAt(new Date().toISOString());
        setMsg({ ok: true, text: `סונכרן ✓ (${j.data?.synced ?? 0} אירועים)` });
        onSynced?.();
      } else {
        setMsg({ ok: false, text: j.error ?? "הסנכרון נכשל" });
      }
    } catch {
      setMsg({ ok: false, text: "שגיאת רשת, נסו שוב" });
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async () => {
    setBusy("disconnect");
    setMsg(null);
    try {
      const res = await fetch("/api/supplier/calendar/external", { method: "DELETE" });
      const j = await res.json();
      if (res.ok && j.success) {
        setConnected(false);
        setUrl("");
        setSyncedAt(null);
        setShowHelp(true);
        setMsg({ ok: true, text: "היומן נותק והחסימות שלו הוסרו" });
        onSynced?.();
      } else {
        setMsg({ ok: false, text: j.error ?? "הניתוק נכשל" });
      }
    } catch {
      setMsg({ ok: false, text: "שגיאת רשת, נסו שוב" });
    } finally {
      setBusy(null);
    }
  };

  const synced = formatSynced(syncedAt);

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 space-y-4",
        connected ? "bg-green-50 border-green-200" : "bg-white border-border"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0",
            connected ? "bg-green-100" : "bg-purple-50"
          )}
        >
          {connected ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <Smartphone className="h-6 w-6 text-purple-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-text-main">
            {connected ? `מחובר ליומן ${PROVIDER_LABEL[provider]} ✓` : "יומן iPhone (iCloud) או Outlook"}
          </h3>
          <p className="text-text-muted text-sm mt-0.5 leading-relaxed">
            {connected
              ? "אירועים ביומן נמשכים לאתר וחוסמים את התאריכים. העדכון אוטומטי פעם ביום, או מיידי בלחיצה על סנכרון."
              : "משתמשים ביומן של האייפון או ב־Outlook? הדביקו קישור שיתוף ציבורי ונחסום אוטומטית את התאריכים התפוסים."}
          </p>
          {synced && (
            <p className="text-xs text-text-muted mt-1">סונכרן לאחרונה: {synced}</p>
          )}
        </div>
      </div>

      {!connected && (
        <div className="grid grid-cols-2 gap-2">
          {(["ICLOUD", "OUTLOOK"] as Provider[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                provider === p
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-text-muted hover:bg-gray-50"
              )}
            >
              {PROVIDER_LABEL[p]}
            </button>
          ))}
        </div>
      )}

      {showHelp && (
        <ol className="list-decimal ps-5 space-y-1 text-sm text-text-main bg-gray-50 rounded-xl p-3">
          {INSTRUCTIONS[provider].map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}

      {!connected && (
        <Input
          ltr
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="webcal://… או https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        {connected ? (
          <>
            <Button
              type="button"
              onClick={sync}
              isLoading={busy === "sync"}
              fullWidth
              className="bg-green-600 hover:bg-green-700 border-green-600"
            >
              <RefreshCw className={cn("h-4 w-4", busy === "sync" && "animate-spin")} />
              סנכרנו עכשיו
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={disconnect}
              isLoading={busy === "disconnect"}
              className="sm:flex-shrink-0"
            >
              נתקו יומן
            </Button>
          </>
        ) : (
          <Button type="button" onClick={save} isLoading={busy === "save"} disabled={!url.trim()} fullWidth>
            <Link2 className="h-4 w-4" />
            חברו וסנכרנו
          </Button>
        )}
      </div>

      {connected && (
        <button
          type="button"
          onClick={() => setShowHelp((v) => !v)}
          className="text-xs text-text-muted underline"
        >
          {showHelp ? "הסתירו הוראות" : "איך משנים את היומן המשותף?"}
        </button>
      )}

      <p className="text-xs text-text-muted leading-relaxed">
        הסנכרון חד־כיווני (קריאה בלבד): אירועים מהיומן חוסמים תאריכים באתר, אך פגישות שנקבעות באתר לא יתווספו ליומן זה.
      </p>

      {msg && (
        <p className={cn("text-xs font-semibold", msg.ok ? "text-green-700" : "text-red-600")}>{msg.text}</p>
      )}
    </div>
  );
}
