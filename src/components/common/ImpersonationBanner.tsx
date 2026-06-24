"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react";

interface Status {
  impersonating: boolean;
  kind?: "customer" | "supplier";
  label?: string;
  redirect?: string;
}

export default function ImpersonationBanner() {
  const [status, setStatus] = useState<Status | null>(null);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    fetch("/api/impersonation-status", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: Status) => {
        setStatus(s);
        if (!s.impersonating && s.redirect) {
          window.location.href = s.redirect;
        }
      })
      .catch(() => setStatus({ impersonating: false }));
  }, []);

  if (!status?.impersonating) return null;

  const stop = async () => {
    setStopping(true);
    const res = await fetch("/api/admin/stop-impersonate", { method: "POST" });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j.redirect) window.location.href = j.redirect;
    else setStopping(false);
  };

  const kindLabel = status.kind === "supplier" ? "כספק" : "כלקוח";

  return (
    <div className="sticky top-0 z-[100] bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-3 shadow-md">
      <span className="flex items-center gap-2 text-sm font-bold min-w-0 truncate">
        <ShieldAlert className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">צפייה {kindLabel}: {status.label}</span>
      </span>
      <button
        onClick={stop}
        disabled={stopping}
        className="inline-flex items-center gap-1.5 bg-white/95 hover:bg-white text-amber-700 font-bold text-xs px-3 py-1.5 rounded-full whitespace-nowrap disabled:opacity-50 transition-colors"
      >
        חזרה לפאנל ניהול
        <ArrowLeft className="h-3 w-3" />
      </button>
    </div>
  );
}
