import prisma from "@/lib/prisma";
import AdminLayout from "@/components/common/AdminLayout";
import ImpersonateButton from "@/components/common/ImpersonateButton";
import { formatRelativeHebrew } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      phone: true,
      weddingDate: true,
      weddingArea: true,
      createdAt: true,
      _count: { select: { meetings: true, saved: true, reviews: true } },
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-text-main">לקוחות</h1>
          <p className="text-sm text-text-muted mt-1">
            {customers.length} לקוחות אחרונים (200 אחרונים)
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface text-text-muted text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-start">שם</th>
                  <th className="px-4 py-3 text-start">טלפון</th>
                  <th className="px-4 py-3 text-start">תאריך האירוע</th>
                  <th className="px-4 py-3 text-start">אזור</th>
                  <th className="px-4 py-3 text-start">פגישות</th>
                  <th className="px-4 py-3 text-start">שמורות</th>
                  <th className="px-4 py-3 text-start">ביקורות</th>
                  <th className="px-4 py-3 text-start">תאריך הרשמה</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-text-muted">אין לקוחות עדיין</td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-surface/50">
                      <td className="px-4 py-3 font-semibold text-text-main">{c.name}</td>
                      <td className="px-4 py-3 text-text-muted" dir="ltr">{c.phone}</td>
                      <td className="px-4 py-3 text-text-muted">
                        {c.weddingDate
                          ? c.weddingDate.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-text-muted">{c.weddingArea ?? "—"}</td>
                      <td className="px-4 py-3 text-text-muted">{c._count.meetings}</td>
                      <td className="px-4 py-3 text-text-muted">{c._count.saved}</td>
                      <td className="px-4 py-3 text-text-muted">{c._count.reviews}</td>
                      <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                        {formatRelativeHebrew(c.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <ImpersonateButton kind="customer" id={c.id} label="צפו כלקוח" />
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
