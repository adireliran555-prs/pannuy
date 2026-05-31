import prisma from "@/lib/prisma";
import AdminLayout from "@/components/common/AdminLayout";
import { formatRelativeHebrew } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "ממתין",
  CONFIRMED: "מאושר",
  REJECTED: "נדחה",
  CANCELLED: "בוטל",
  COMPLETED: "הסתיים",
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
};

export default async function AdminMeetingsPage() {
  const meetings = await prisma.meeting.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      customer: { select: { name: true, phone: true } },
      supplier: { select: { name: true, slug: true } },
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-text-main">פגישות</h1>
          <p className="text-sm text-text-muted mt-1">200 פגישות אחרונות</p>
        </div>

        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface text-text-muted text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-start">לקוח</th>
                  <th className="px-4 py-3 text-start">ספק</th>
                  <th className="px-4 py-3 text-start">תאריך מבוקש</th>
                  <th className="px-4 py-3 text-start">שעה</th>
                  <th className="px-4 py-3 text-start">סטטוס</th>
                  <th className="px-4 py-3 text-start">סוג</th>
                  <th className="px-4 py-3 text-start">נוצרה</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {meetings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-text-muted">אין פגישות עדיין</td>
                  </tr>
                ) : (
                  meetings.map((m) => (
                    <tr key={m.id} className="hover:bg-surface/50">
                      <td className="px-4 py-3 font-semibold text-text-main">
                        <div>{m.customer?.name}</div>
                        <div className="text-xs text-text-muted" dir="ltr">{m.customer?.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{m.supplier?.name}</td>
                      <td className="px-4 py-3 text-text-muted">
                        {m.requestedDate.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-text-muted" dir="ltr">{m.startTime}–{m.endTime}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border", STATUS_CLASS[m.status])}>
                          {STATUS_LABEL[m.status] ?? m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{m.meetingType}</td>
                      <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                        {formatRelativeHebrew(m.createdAt)}
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
