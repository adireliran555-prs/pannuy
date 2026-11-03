"use client";

import useSWR from "swr";
import OutcomePrompt from "./OutcomePrompt";

interface PendingReferral {
  id: string;
  supplier: { name: string } | null;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []) as PendingReferral[];
};

/** Lists every referral the customer hasn't told us about yet. */
export default function PendingOutcomePrompt() {
  const { data = [], mutate } = useSWR("/api/referrals/pending-outcomes", fetcher, {
    revalidateOnFocus: false,
  });
  if (data.length === 0) return null;
  return (
    <div className="space-y-3">
      {data.map((r) => (
        <OutcomePrompt
          key={r.id}
          referralId={r.id}
          supplierName={r.supplier?.name ?? "הספק"}
          onDone={() => setTimeout(() => mutate(), 1500)}
        />
      ))}
    </div>
  );
}
