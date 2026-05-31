import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";

type Timeframe = "week" | "month" | "3months";
const DAYS: Record<Timeframe, number> = { week: 7, month: 30, "3months": 90 };

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const supplierId = session.id;
    const tf = (request.nextUrl.searchParams.get("tf") ?? "month") as Timeframe;
    const days = DAYS[tf] ?? 30;

    const now = new Date();
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevStart = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

    const [views, prevViews, meetings, prevMeetings, confirmed, viewsByDay, recentMeetings, recentSaves, recentViews] =
      await Promise.all([
        prisma.profileView.count({
          where: { supplierId, createdAt: { gte: periodStart } },
        }),
        prisma.profileView.count({
          where: { supplierId, createdAt: { gte: prevStart, lt: periodStart } },
        }),
        prisma.meeting.count({
          where: { supplierId, createdAt: { gte: periodStart } },
        }),
        prisma.meeting.count({
          where: { supplierId, createdAt: { gte: prevStart, lt: periodStart } },
        }),
        prisma.meeting.count({
          where: {
            supplierId,
            createdAt: { gte: periodStart },
            status: { in: ["CONFIRMED", "COMPLETED"] },
          },
        }),
        // 7 days of views — last week, day-of-week aggregation
        prisma.profileView.findMany({
          where: { supplierId, createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
          select: { createdAt: true },
        }),
        prisma.meeting.findMany({
          where: { supplierId },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { customer: { select: { name: true, weddingArea: true } } },
        }),
        prisma.savedSupplier.findMany({
          where: { supplierId },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { customer: { select: { name: true, weddingArea: true } } },
        }),
        prisma.profileView.findMany({
          where: { supplierId },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { customer: { select: { name: true, weddingArea: true } } },
        }),
      ]);

    const rate = meetings > 0 ? Math.round((confirmed / meetings) * 100) : 0;
    const viewDeltaPct =
      prevViews > 0 ? Math.round(((views - prevViews) / prevViews) * 100) : views > 0 ? 100 : 0;
    const requestDelta = meetings - prevMeetings;

    // Day-of-week buckets, Sunday=0 .. Saturday=6
    const weekData = [0, 0, 0, 0, 0, 0, 0];
    for (const v of viewsByDay) {
      weekData[v.createdAt.getDay()]++;
    }

    type Activity = { kind: "view" | "save" | "meeting"; text: string; createdAt: Date };
    const activity: Activity[] = [
      ...recentViews.map((v) => ({
        kind: "view" as const,
        text: v.customer?.weddingArea
          ? `זוג מ${v.customer.weddingArea} צפה בפרופיל שלכם`
          : "מישהו צפה בפרופיל שלכם",
        createdAt: v.createdAt,
      })),
      ...recentSaves.map((s) => ({
        kind: "save" as const,
        text: s.customer?.weddingArea
          ? `זוג מ${s.customer.weddingArea} שמר את הפרופיל שלכם`
          : "מישהו שמר את הפרופיל שלכם",
        createdAt: s.createdAt,
      })),
      ...recentMeetings.map((m) => ({
        kind: "meeting" as const,
        text: m.customer?.weddingArea
          ? `זוג מ${m.customer.weddingArea} ביקש פגישה`
          : "התקבלה בקשת פגישה",
        createdAt: m.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 8);

    return NextResponse.json({
      success: true,
      data: {
        views,
        requests: meetings,
        confirmed,
        rate,
        viewDeltaPct,
        requestDelta,
        weekData,
        activity: activity.map((a) => ({ kind: a.kind, text: a.text, at: a.createdAt.toISOString() })),
      },
    });
  } catch (err) {
    console.error("[GET /api/supplier/analytics]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
