import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/api-auth";

const DAYS: Record<string, number> = { week: 7, month: 30, "3months": 90 };

export async function GET(request: NextRequest) {
  try {
    const { error } = requireAdminSession(request);
    if (error) return error;

    const tf = request.nextUrl.searchParams.get("tf") ?? "month";
    const days = DAYS[tf] ?? 30;
    const now = new Date();
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevStart = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

    const [
      totalCustomers,
      totalSuppliers,
      verifiedSuppliers,
      activeSuppliers,
      newCustomers,
      prevNewCustomers,
      newSuppliers,
      newMeetings,
      prevNewMeetings,
      meetingsByStatus,
      totalReviews,
      totalProfileViews,
      newProfileViews,
      avgRatingAgg,
      suppliersByCategory,
      customersByArea,
      topByRating,
      topByMeetings,
      signupsRaw,
      meetingsRaw,
      viewsRaw,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.supplier.count(),
      prisma.supplier.count({ where: { isVerified: true } }),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.user.count({ where: { createdAt: { gte: periodStart } } }),
      prisma.user.count({ where: { createdAt: { gte: prevStart, lt: periodStart } } }),
      prisma.supplier.count({ where: { createdAt: { gte: periodStart } } }),
      prisma.meeting.count({ where: { createdAt: { gte: periodStart } } }),
      prisma.meeting.count({ where: { createdAt: { gte: prevStart, lt: periodStart } } }),
      prisma.meeting.groupBy({
        by: ["status"],
        _count: { _all: true },
        orderBy: { status: "asc" },
      }),
      prisma.review.count(),
      prisma.profileView.count(),
      prisma.profileView.count({ where: { createdAt: { gte: periodStart } } }),
      prisma.supplier.aggregate({
        where: { ratingCount: { gt: 0 } },
        _avg: { ratingAvg: true },
      }),
      prisma.supplier.groupBy({
        by: ["category"],
        _count: { _all: true },
        orderBy: { category: "asc" },
      }),
      prisma.user.findMany({
        where: { weddingArea: { not: null } },
        select: { weddingArea: true },
      }),
      prisma.supplier.findMany({
        where: { ratingCount: { gt: 0 } },
        orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
        take: 5,
        select: { id: true, name: true, slug: true, ratingAvg: true, ratingCount: true, category: true },
      }),
      // Top suppliers by meeting count in window
      prisma.meeting.groupBy({
        by: ["supplierId"],
        where: { createdAt: { gte: periodStart } },
        _count: { supplierId: true },
        orderBy: { _count: { supplierId: "desc" } },
        take: 5,
      }),
      // Daily customer signups (last `days` days)
      prisma.user.findMany({
        where: { createdAt: { gte: periodStart } },
        select: { createdAt: true },
      }),
      // Daily meeting requests (last `days` days)
      prisma.meeting.findMany({
        where: { createdAt: { gte: periodStart } },
        select: { createdAt: true },
      }),
      // Daily profile views (last `days` days)
      prisma.profileView.findMany({
        where: { createdAt: { gte: periodStart } },
        select: { createdAt: true },
      }),
    ]);

    // Resolve top by meetings
    const topMeetingIds = topByMeetings.map((t) => t.supplierId);
    const topMeetingDetails = topMeetingIds.length
      ? await prisma.supplier.findMany({
          where: { id: { in: topMeetingIds } },
          select: { id: true, name: true, slug: true, category: true },
        })
      : [];
    const topByMeetingsResolved = topByMeetings.map((t) => {
      const s = topMeetingDetails.find((d) => d.id === t.supplierId);
      const count = (t as unknown as { _count: { supplierId: number } })._count.supplierId;
      return {
        id: t.supplierId,
        name: s?.name ?? "—",
        slug: s?.slug ?? "",
        category: s?.category ?? "PHOTOGRAPHER",
        count,
      };
    });

    // Build daily series for the period
    function bucketByDay(rows: { createdAt: Date }[]) {
      const map = new Map<string, number>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split("T")[0];
        map.set(key, 0);
      }
      for (const r of rows) {
        const key = r.createdAt.toISOString().split("T")[0];
        if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
      }
      return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
    }

    const signupsSeries = bucketByDay(signupsRaw);
    const meetingsSeries = bucketByDay(meetingsRaw);
    const viewsSeries = bucketByDay(viewsRaw);

    const customerAreas = customersByArea.reduce<Record<string, number>>((acc, u) => {
      const k = u.weddingArea ?? "—";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});

    const customerDeltaPct =
      prevNewCustomers > 0
        ? Math.round(((newCustomers - prevNewCustomers) / prevNewCustomers) * 100)
        : newCustomers > 0
        ? 100
        : 0;
    const meetingDeltaPct =
      prevNewMeetings > 0
        ? Math.round(((newMeetings - prevNewMeetings) / prevNewMeetings) * 100)
        : newMeetings > 0
        ? 100
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        timeframe: tf,
        totals: {
          customers: totalCustomers,
          suppliers: totalSuppliers,
          verifiedSuppliers,
          activeSuppliers,
          reviews: totalReviews,
          profileViews: totalProfileViews,
          avgRating: avgRatingAgg._avg.ratingAvg ?? 0,
        },
        period: {
          newCustomers,
          customerDeltaPct,
          newSuppliers,
          newMeetings,
          meetingDeltaPct,
          newProfileViews,
        },
        meetingsByStatus: meetingsByStatus.map((m) => ({
          status: m.status,
          count: (m as unknown as { _count: { _all: number } })._count._all,
        })),
        suppliersByCategory: suppliersByCategory.map((s) => ({
          category: s.category,
          count: (s as unknown as { _count: { _all: number } })._count._all,
        })),
        customersByArea: Object.entries(customerAreas).map(([area, count]) => ({ area, count })),
        topByRating,
        topByMeetings: topByMeetingsResolved,
        series: {
          signups: signupsSeries,
          meetings: meetingsSeries,
          views: viewsSeries,
        },
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/stats]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
