import prisma from "@/lib/prisma";
import AdminLayout from "@/components/common/AdminLayout";
import ReferralsTable from "./ReferralsTable";
import { ReferralStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminReferralsPage() {
  const referrals = await prisma.referral.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      status: true,
      channel: true,
      followUpCount: true,
      createdAt: true,
      lastFollowUpAt: true,
      customerConfirmedAt: true,
      adminNotes: true,
      meetingId: true,
      customer: { select: { name: true, phone: true } },
      supplier: { select: { name: true, slug: true } },
    },
  });

  const rows = referrals.map((r) => ({
    id: r.id,
    status: r.status,
    channel: r.channel,
    followUpCount: r.followUpCount,
    createdAt: r.createdAt.toISOString(),
    customerName: r.customer?.name ?? "—",
    customerPhone: r.customer?.phone ?? "",
    supplierName: r.supplier?.name ?? "—",
    supplierSlug: r.supplier?.slug ?? "",
    hasMeeting: Boolean(r.meetingId),
    adminNotes: r.adminNotes ?? "",
  }));

  const count = (s: ReferralStatus) => rows.filter((r) => r.status === s).length;
  const needsCall = count(ReferralStatus.NO_ANSWER);

  const stats = [
    { label: "סה״כ הפניות", value: rows.length },
    { label: "חדשות", value: count(ReferralStatus.NEW) },
    { label: "ממתינות לתשובה", value: count(ReferralStatus.AWAITING_REPLY) },
    { label: "נוצר קשר", value: count(ReferralStatus.CONNECTED) },
    { label: "להתקשר", value: needsCall },
    { label: "הומרו", value: count(ReferralStatus.CONVERTED) },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-text-main">הפניות (Leads)</h1>
          <p className="text-sm text-text-muted">
            מעקב אחר כל הפנייה שאנחנו עושים — מהקשר הראשון ועד התוצאה.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-border p-4 text-center"
            >
              <div className="text-2xl font-black text-text-main">{s.value}</div>
              <div className="text-xs text-text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <ReferralsTable initialRows={rows} />
      </div>
    </AdminLayout>
  );
}
