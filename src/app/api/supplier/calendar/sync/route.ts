import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { getSupplierBusySlots } from "@/lib/google-calendar";
import { invalidateAvailabilityCache } from "@/lib/availability";
import { AvailabilitySource } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const supplier = await prisma.supplier.findUnique({
      where: { id: session.id },
      select: { googleRefreshToken: true },
    });

    if (!supplier?.googleRefreshToken) {
      return NextResponse.json(
        { success: false, error: "יש לחבר את Google Calendar תחילה" },
        { status: 400 }
      );
    }

    const now = new Date();
    const threeMonthsLater = new Date(now);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    const busySlots = await getSupplierBusySlots(
      session.id,
      now,
      threeMonthsLater
    );

    // Upsert busy slots from Google into AvailabilitySlot
    let upsertedCount = 0;
    for (const busy of busySlots) {
      const start = new Date(busy.start);
      const end = new Date(busy.end);
      const dateStr = start.toISOString().slice(0, 10);

      // Map to HH:mm working slot format
      const startTime = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
      const endTime = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;

      await prisma.availabilitySlot.upsert({
        where: {
          supplierId_date_googleEventId: {
            supplierId: session.id,
            date: new Date(dateStr),
            googleEventId: `${dateStr}-${startTime}`,
          },
        },
        create: {
          supplierId: session.id,
          date: new Date(dateStr),
          startTime,
          endTime,
          isBlocked: true,
          source: AvailabilitySource.GOOGLE,
          googleEventId: `${dateStr}-${startTime}`,
        },
        update: {
          startTime,
          endTime,
          syncedAt: new Date(),
        },
      });
      upsertedCount++;
    }

    await invalidateAvailabilityCache(session.id);

    return NextResponse.json({
      success: true,
      data: { synced: upsertedCount },
    });
  } catch (err) {
    console.error("[POST /api/supplier/calendar/sync]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
