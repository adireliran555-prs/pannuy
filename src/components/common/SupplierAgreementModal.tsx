"use client";

import { useState } from "react";
import { AlertTriangle, Percent, FileText } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import SupplierAgreementBody, { CommissionTable } from "@/components/legal/SupplierAgreementBody";
import {
  CIRCUMVENTION_PENALTY_ILS,
  CIRCUMVENTION_PRESUMPTION_MONTHS,
  LATE_PAYMENT_MONTHLY_INTEREST,
  DEAL_REPORT_DAYS,
  COMMISSION_PAYMENT_DAYS,
  formatRate,
} from "@/lib/commission";

interface Props {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
  isLoading?: boolean;
}

const CHECKS = [
  { key: "full", label: "קראתי ואני מאשר/ת את הסכם ההתקשרות עם ספקים במלואו." },
  {
    key: "commission",
    label:
      "אני מאשר/ת את סעיף העמלות: עמלת הצלחה לפי הטבלה מכל עסקה שמקורה בפנייה מהפלטפורמה — ללא דמי מנוי.",
  },
  {
    key: "penalty",
    label: `אני מאשר/ת את איסור עקיפת הפלטפורמה, הפיצוי המוסכם בסך ₪${CIRCUMVENTION_PENALTY_ILS.toLocaleString("he-IL")} ותקופת ההתקשרות (שנה, מתחדשת אוטומטית; הודעה 90 יום מראש).`,
  },
] as const;

type CheckKey = (typeof CHECKS)[number]["key"];

/**
 * Shows the full supplier agreement (commission table + penalties up front) and
 * requires three explicit confirmations before signup continues.
 */
export default function SupplierAgreementModal({ open, onClose, onAccept, isLoading }: Props) {
  const [checked, setChecked] = useState<Record<CheckKey, boolean>>({
    full: false,
    commission: false,
    penalty: false,
  });
  const [attempted, setAttempted] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const allChecked = CHECKS.every((c) => checked[c.key]);

  const handleAccept = () => {
    setAttempted(true);
    if (!allChecked) return;
    onAccept();
  };

  return (
    <Modal open={open} onClose={onClose} title="הסכם התקשרות עם ספקים" size="lg">
      <div className="flex flex-col max-h-[80vh] sm:max-h-[75vh]">
        <div className="flex-1 overflow-y-auto space-y-5 pe-1">
          <p className="text-sm text-text-muted leading-relaxed">
            לפני סיום ההרשמה, אנא קראו את תנאי ההתקשרות. אלו הנקודות המרכזיות:
          </p>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 font-bold text-text-main">
              <Percent className="h-4 w-4 text-primary" />
              עמלות לפי סוג השירות
            </h3>
            <CommissionTable />
            <p className="text-xs text-text-muted leading-relaxed">
              ללא דמי מנוי. העמלה מחושבת מהתמורה לפני מע״מ, גם בתשלום ישיר מחוץ
              לפלטפורמה. דיווח על סגירת עסקה בתוך {DEAL_REPORT_DAYS} ימים; העברת
              העמלה בתוך {COMMISSION_PAYMENT_DAYS} ימים מקבלת כל תשלום.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 font-bold text-text-main">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              קנסות ופיצויים מוסכמים
            </h3>
            <ul className="space-y-1.5 text-sm text-text-main list-disc ps-5">
              <li>
                עקיפת הפלטפורמה (סגירת עסקה עם לקוח שהגיע דרכנו ללא דיווח): פיצוי
                מוסכם קבוע של{" "}
                <strong>₪{CIRCUMVENTION_PENALTY_ILS.toLocaleString("he-IL")}</strong>{" "}
                לכל מקרה, בנוסף לעמלה שנמנעה.
              </li>
              <li>
                עסקה שנסגרה בתוך {CIRCUMVENTION_PRESUMPTION_MONTHS} חודשים מהפנייה
                הראשונה ולא דווחה — נחשבת עקיפה, אלא אם הוכח אחרת.
              </li>
              <li>
                איחור בתשלום עמלה: ריבית חוזית של{" "}
                <strong>{formatRate(LATE_PAYMENT_MONTHLY_INTEREST)} לחודש</strong> (או
                ריבית פיגורים כדין, הגבוה מביניהם) מהיום ה־15 לאיחור.
              </li>
              <li>הפרה יסודית (עמלות, עקיפה, סודיות, פרטיות) — השעיה או הסרה לאלתר.</li>
              <li>תקופת ההתקשרות: שנה, מתחדשת אוטומטית; אי־חידוש בהודעה של 90 יום מראש.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <button
              type="button"
              onClick={() => setShowFull((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-primary underline"
            >
              <FileText className="h-4 w-4" />
              {showFull ? "הסתירו את ההסכם המלא" : "הציגו את ההסכם המלא"}
            </button>
            {showFull && (
              <div className="rounded-xl border border-border bg-gray-50 p-4 text-sm text-text-main space-y-5 [&_h2]:text-base">
                <SupplierAgreementBody />
              </div>
            )}
          </section>

          <section className="space-y-3 border-t border-border pt-4">
            {CHECKS.map((c) => (
              <label key={c.key} className="flex items-start gap-2 text-sm text-text-main cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded accent-primary"
                  checked={checked[c.key]}
                  onChange={(e) => setChecked((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                />
                <span>{c.label}</span>
              </label>
            ))}
            {attempted && !allChecked && (
              <p className="text-red-500 text-xs font-medium">יש לאשר את שלוש התיבות כדי להמשיך</p>
            )}
          </section>
        </div>

        <div className="flex gap-3 pt-4 mt-2 border-t border-border bg-white">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={isLoading}>
            חזרה
          </Button>
          <Button fullWidth isLoading={isLoading} onClick={handleAccept}>
            מאשר/ת וממשיך/ה
          </Button>
        </div>
      </div>
    </Modal>
  );
}
