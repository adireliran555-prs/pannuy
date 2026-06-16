import prisma from "@/lib/prisma";
import AdminLayout from "@/components/common/AdminLayout";
import { formatPrice, formatRelativeHebrew } from "@/lib/utils";
import PayoutActions from "./PayoutActions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "ממתין",
  APPROVED: "אושר",
  PAID: "שולם",
  REJECTED: "נדחה",
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

export default async function AdminPayoutsPage() {
  const payouts = await prisma.payoutRequest.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amountIls: true,
      status: true,
      note: true,
      createdAt: true,
      processedAt: true,
      supplier: { select: { name: true } },
    },
  });

  const rows = payouts.map((p) => ({
    id: p.id,
    supplierName: p.supplier.name,
    amountIls: p.amountIls,
    status: p.status,
    note: p.note,
    createdAt: p.createdAt.toISOString(),
    processedAt: p.processedAt?.toISOString() ?? null,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-text-main">משיכות</h1>
          <p className="text-sm text-text-muted mt-1">{rows.length} בקשות משיכה סה״כ</p>
        </div>

        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface text-text-muted text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-start">ספק</th>
                  <th className="px-4 py-3 text-start">סכום</th>
                  <th className="px-4 py-3 text-start">סטטוס</th>
                  <th className="px-4 py-3 text-start">נוצר</th>
                  <th className="px-4 py-3 text-start">טופל</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-text-muted">
                      אין בקשות משיכה
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="hover:bg-surface/50">
                      <td className="px-4 py-3 font-semibold text-text-main">
                        <div>{r.supplierName}</div>
                        {r.note && (
                          <div className="text-xs text-text-muted">{r.note}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-text-main whitespace-nowrap">
                        {formatPrice(r.amountIls)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            STATUS_CLASS[r.status] ?? "bg-gray-50 text-gray-500 border-gray-200"
                          }`}
                        >
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                        {formatRelativeHebrew(r.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                        {r.processedAt ? formatRelativeHebrew(r.processedAt) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <PayoutActions id={r.id} status={r.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
