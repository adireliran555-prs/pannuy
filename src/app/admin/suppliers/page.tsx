import prisma from "@/lib/prisma";
import AdminLayout from "@/components/common/AdminLayout";
import SuppliersTable from "./SuppliersTable";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  PHOTOGRAPHER: "צילום חתונה",
  VIDEOGRAPHER: "צילום וידאו",
  BRIDAL_SUITE: "מקומות התארגנות",
  DJ: "DJ ומוסיקה",
  FLORIST: "עיצוב פרחוני",
  CATERING: "קייטרינג",
};

export default async function AdminSuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      phone: true,
      city: true,
      category: true,
      ratingAvg: true,
      ratingCount: true,
      isVerified: true,
      isActive: true,
      createdAt: true,
      _count: { select: { meetings: true, profileViews: true } },
    },
  });

  const rows = suppliers.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    phone: s.phone,
    city: s.city ?? "—",
    categoryLabel: CATEGORY_LABEL[s.category] ?? s.category,
    rating: s.ratingAvg,
    ratingCount: s.ratingCount,
    isVerified: s.isVerified,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
    meetings: s._count.meetings,
    views: s._count.profileViews,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-text-main">ספקים</h1>
          <p className="text-sm text-text-muted mt-1">{suppliers.length} ספקים סה״כ</p>
        </div>
        <SuppliersTable initialRows={rows} />
      </div>
    </AdminLayout>
  );
}
