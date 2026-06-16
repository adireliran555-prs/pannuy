"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, X } from "lucide-react";

type Status = "PENDING" | "APPROVED" | "PAID" | "REJECTED";

export default function PayoutActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const update = async (next: Status) => {
    setBusy(true);
    const res = await fetch(`/api/admin/payouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  };

  // Terminal states: nothing more to do
  if (status === "PAID" || status === "REJECTED") {
    return <span className="text-xs text-text-muted">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 whitespace-nowrap">
      {status === "PENDING" && (
        <button
          onClick={() => update("APPROVED")}
          disabled={busy}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
        >
          <Check className="h-3 w-3" />
          אישור
        </button>
      )}
      <button
        onClick={() => update("PAID")}
        disabled={busy}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
      >
        <CreditCard className="h-3 w-3" />
        סמן כשולם
      </button>
      <button
        onClick={() => update("REJECTED")}
        disabled={busy}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        <X className="h-3 w-3" />
        דחייה
      </button>
    </div>
  );
}
