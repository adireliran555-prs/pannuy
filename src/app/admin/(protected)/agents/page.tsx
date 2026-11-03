import prisma from "@/lib/prisma";
import AdminLayout from "@/components/common/AdminLayout";
import AgentsTable from "./AgentsTable";

export const dynamic = "force-dynamic";

export default async function AdminAgentsPage() {
  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, phone: true, referralCode: true, isActive: true, createdAt: true,
      _count: { select: { referredCustomers: true, referredSuppliers: true } },
      earnings: { select: { amountIls: true, status: true } },
    },
  });

  const rows = agents.map((a) => {
    const sum = (s: string) => a.earnings.filter((e) => e.status === s).reduce((t, e) => t + e.amountIls, 0);
    return {
      id: a.id, name: a.name, phone: a.phone, referralCode: a.referralCode, isActive: a.isActive,
      createdAt: a.createdAt.toISOString(),
      referredCustomers: a._count.referredCustomers, referredSuppliers: a._count.referredSuppliers,
      pending: sum("PENDING"), confirmed: sum("CONFIRMED"), paid: sum("PAID"),
    };
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-text-main">סוכנים</h1>
        <p className="text-text-muted text-sm mt-1">{rows.length} סוכנים רשומים</p>
      </div>
      <AgentsTable initialRows={rows} />
    </AdminLayout>
  );
}
