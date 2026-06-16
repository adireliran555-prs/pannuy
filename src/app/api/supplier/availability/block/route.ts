import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { invalidateAvailabilityCache } from "@/lib/availability";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

    const firstDay = new Date(Date.UTC(year, month - 1, 1));
    const lastDay = new Date(Date.UTC(year, month, 0));

    // Any blocked slot makes that day busy on the supplier's calendar — manual
    // full-day blocks (00:00) AND Google-synced timed meetings (e.g. 13:00).
    // Don't filter by startTime, or timed Google events stay invisible.
    const slots = await prisma.availabilitySlot.findMany({
      where: {
        supplierId: session.id,
        date: { gte: firstDay, lte: lastDay },
        isBlocked: true,
      },
      orderBy: { startTime: "asc" },
      select: { id: true, date: true, source: true },
    });

    // One entry per date; prefer a MANUAL row's id so "unblock" targets it.
    const byDate = new Map<string, { id: string; date: string; source: string }>();
    for (const s of slots) {
      const date = s.date.toISOString().slice(0, 10);
      const existing = byDate.get(date);
      if (!existing || (existing.source !== "MANUAL" && s.source === "MANUAL")) {
        byDate.set(date, { id: s.id, date, source: s.source });
      }
    }

    return NextResponse.json({
      success: true,
      data: Array.from(byDate.values()),
    });
  } catch (err) {
    console.error("[GET /api/supplier/availability/block]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const body = await request.json();
    const { date, startTime, endTime } = body as {
      date?: string;
      startTime?: string;
      endTime?: string;
    };

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: "תאריך, שעת התחלה וסיום חובה" },
        { status: 400 }
      );
    }

    const slot = await prisma.availabilitySlot.create({
      data: {
        supplierId: session.id,
        date: new Date(date),
        startTime,
        endTime,
        isBlocked: true,
        source: "MANUAL",
      },
    });

    await invalidateAvailabilityCache(session.id);

    return NextResponse.json({ success: true, data: slot }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/supplier/availability/block]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
