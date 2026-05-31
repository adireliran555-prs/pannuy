"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";

export default function ImpersonateButton({
  kind,
  id,
  label,
}: {
  kind: "customer" | "supplier";
  id: string;
  label: string;
}) {
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    const res = await fetch(`/api/admin/impersonate/${kind}/${id}`, { method: "POST" });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j.redirect) window.location.href = j.redirect;
    else setBusy(false);
  };

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-primary disabled:opacity-50"
    >
      <LogIn className="h-3 w-3" />
      {label}
    </button>
  );
}
