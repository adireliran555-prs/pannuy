"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import type { Category } from "@prisma/client";
import type { PickerPackageDTO } from "@/types/event";
import { useEvent } from "@/hooks/useEvent";
import { formatIls } from "@/lib/event-planning";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS_SINGULAR } from "@/lib/categories";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import SelectablePackage from "./SelectablePackage";

interface ProfilePlanPickerProps {
  eventId: string;
  category: Category;
  supplierId: string;
  supplierName: string;
  packages: PickerPackageDTO[];
  /** "banner" = full-width strip (default). "sidebar" = compact, single-column
   *  block that sits inside the profile's booking sidebar. */
  variant?: "banner" | "sidebar";
}

/** Plan-aware selection block rendered on the supplier profile ONLY when the
 *  couple arrives from a plan step (?plan=<eventId>&cat=<CATEGORY>). Lets them
 *  pick one of this supplier's packages and commit it to the plan item for the
 *  matching category, then routes back to /plan. Additive — absent these
 *  params the profile renders exactly as usual. */
export default function ProfilePlanPicker({
  eventId,
  category,
  supplierId,
  supplierName,
  packages,
  variant = "banner",
}: ProfilePlanPickerProps) {
  const sidebar = variant === "sidebar";
  const router = useRouter();
  const { items, isLoading, updateItem } = useEvent();

  const item = useMemo(
    () => items.find((i) => i.category === category) ?? null,
    [items, category]
  );

  const alreadySelected =
    item?.status === "SELECTED" && item.selectedSupplier?.id === supplierId;

  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Fall back to the already-committed package when this supplier is selected.
  const selectedPkg =
    picked ?? (alreadySelected ? item?.selectedPackage?.id ?? null : null);

  const categoryLabel = CATEGORY_LABELS_SINGULAR[category] ?? category;
  const allocated = item?.allocatedBudget ?? null;

  async function handleSelect() {
    if (!item) {
      setError("לא מצאנו את הקטגוריה הזו בתוכנית שלכם");
      return;
    }
    if (!selectedPkg) {
      setError("יש לבחור חבילה כדי להוסיף לאירוע");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const json = await updateItem(eventId, item.id, {
        status: "SELECTED",
        selectedSupplierId: supplierId,
        selectedPackageId: selectedPkg,
      });
      if (!json?.success) {
        setError(json?.error ?? "שגיאה פנימית");
        return;
      }
      router.push("/plan");
    } catch {
      setError("שגיאה פנימית");
    } finally {
      setBusy(false);
    }
  }

  const body = (
    <>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="h-5 w-5 flex-shrink-0 text-primary" />
          <h2
            className={cn(
              "font-black text-text-main",
              sidebar ? "text-lg" : "text-xl"
            )}
          >
            בחרו חבילה לאירוע שלכם
          </h2>
          <Badge variant="primary" size="sm">
            {categoryLabel}
          </Badge>
        </div>
        <p className="text-sm text-text-muted">
          הוסיפו את {supplierName} לתוכנית האירוע שלכם — בחרו חבילה ונחזיר
          אתכם לתוכנית.
        </p>
      </div>

      {packages.length === 0 ? (
        <p className="rounded-xl bg-white/70 p-3 text-sm text-text-muted">
          לספק זה עדיין אין חבילות לבחירה. אפשר לחזור לתוכנית ולבחור ספק אחר.
        </p>
      ) : (
        <>
          <div
            className={cn(
              "grid grid-cols-1 gap-2",
              !sidebar && "sm:grid-cols-2"
            )}
          >
            {packages.map((pkg) => (
              <SelectablePackage
                key={pkg.id}
                pkg={pkg}
                selected={selectedPkg === pkg.id}
                overBudget={allocated != null && pkg.price > allocated}
                onSelect={() => setPicked(pkg.id)}
              />
            ))}
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <div
            className={cn(
              "flex flex-col gap-2",
              !sidebar && "sm:flex-row sm:items-center"
            )}
          >
            <Button
              size="lg"
              fullWidth={sidebar}
              onClick={handleSelect}
              disabled={!selectedPkg || busy || isLoading}
              isLoading={busy}
              leftIcon={
                alreadySelected ? <Check className="h-4 w-4" /> : undefined
              }
              className={cn(!sidebar && "sm:min-w-56")}
            >
              {alreadySelected ? "נבחר לאירוע" : "בחר לאירוע"}
            </Button>
            {selectedPkg && allocated != null && (
              <span className="text-xs text-text-muted">
                תקציב מומלץ לקטגוריה:{" "}
                <span dir="ltr">{formatIls(allocated)}</span>
              </span>
            )}
          </div>
        </>
      )}
    </>
  );

  if (sidebar) return <div className="space-y-4">{body}</div>;

  return (
    <div className="border-b border-primary/20 bg-primary-light/60">
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6">{body}</div>
    </div>
  );
}
