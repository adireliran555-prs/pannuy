import prisma from "@/lib/prisma";
import AdminLayout from "@/components/common/AdminLayout";
import DealsTable from "./DealsTable";

export const dynamic = "force-dynamic";

export default async function AdminDealsPage() {
  const deals = await prisma.dealReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      supplier: { select: { name: true, phone: true, category: true } },
      customer: { select: { name: true, phone: true } },
    },
  });

  const rows = deals.map((d) => ({
    id: d.id,
    supplierName: d.supplier.name,
    supplierPhone: d.supplier.phone,
    category: d.supplier.category,
    customerName: d.customer?.name ?? d.customerName ?? null,
    customerPhone: d.customer?.phone ?? d.customerPhone ?? null,
    matched: !!d.customerId,
    referralId: d.referralId,
    eventDate: d.eventDate ? d.eventDate.toISOString().slice(0, 10) : null,
    amountIls: d.amountIls,
    commissionIls: d.commissionIls,
    status: d.status,
    note: d.note,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-text-main">עסקאות שדווחו</h1>
        <p className="text-text-muted text-sm mt-1">
          עסקאות שספקים דיווחו עליהן ידנית (מחוץ לפגישות באתר). אמתו או סמנו כשנויות במחלוקת.
        </p>
      </div>
      <DealsTable initialRows={rows} />
    </AdminLayout>
  );
}
