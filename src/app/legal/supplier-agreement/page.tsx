import type { Metadata } from "next";
import LegalPageShell from "@/components/legal/LegalPageShell";
import SupplierAgreementBody from "@/components/legal/SupplierAgreementBody";
import { BRAND_NAME } from "@/lib/branding";

export const metadata: Metadata = {
  title: "הסכם התקשרות עם ספקים",
  description: `תנאי ההתקשרות המחייבים לספקים המצטרפים לפלטפורמת ${BRAND_NAME}.`,
};

export default function SupplierAgreementPage() {
  return (
    <LegalPageShell title="הסכם התקשרות עם ספקים" updated="נובמבר 2026">
      <SupplierAgreementBody />
    </LegalPageShell>
  );
}
