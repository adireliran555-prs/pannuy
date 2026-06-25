import type { Metadata } from "next";
import LegalPageShell from "@/components/legal/LegalPageShell";
import { BRAND_NAME, SUPPORT_EMAIL } from "@/lib/branding";

export const metadata: Metadata = {
  title: `יצירת קשר | ${BRAND_NAME}`,
};

export default function ContactPage() {
  return (
    <LegalPageShell title="יצירת קשר" updated="יוני 2026">
      <p>
        נשמח לעזור בכל שאלה על {BRAND_NAME} — חיפוש ספקים, הצטרפות כספק, או
        בעיות טכניות.
      </p>
      <div className="rounded-2xl border border-border bg-white p-6 space-y-2">
        <p className="text-sm text-text-muted">דוא&quot;ל</p>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="text-lg font-bold text-primary hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>
      </div>
      <p className="text-sm text-text-muted">
        זמן מענה משוער: עד 2 ימי עסקים.
      </p>
    </LegalPageShell>
  );
}
