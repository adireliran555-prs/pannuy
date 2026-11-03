import { Suspense } from "react";
import AdminLayout from "@/components/common/AdminLayout";
import EvidenceExplorer from "./EvidenceExplorer";

export const dynamic = "force-dynamic";

export default function AdminEvidencePage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-text-main">ראיות — ציר זמן אירועים</h1>
          <p className="text-sm text-text-muted">
            יומן בלתי‑ניתן‑לשינוי של כל מגע בין לקוח לספק: צפיות, חשיפת טלפון, וואטסאפ, פגישות,
            דיווחי עסקאות ופעולות אדמין. כל רשומה חתומה ומשורשרת לקודמתה.
          </p>
        </div>
        <Suspense fallback={null}>
          <EvidenceExplorer />
        </Suspense>
      </div>
    </AdminLayout>
  );
}
