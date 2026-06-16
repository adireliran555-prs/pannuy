import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import {
  registerCalendarWatch,
  syncSupplierBusyDays,
  ensurePannuyCalendar,
} from "@/lib/google-calendar";

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

    // Make sure the dedicated "פנוי — זמינות" calendar exists (provisions it for
    // suppliers who connected before this feature), then sync only from it.
    await ensurePannuyCalendar(session.id);

    const { synced } = await syncSupplierBusyDays(session.id);

    // Register a push-notification watch so future changes sync automatically.
    // Best-effort — never fail the sync because of this.
    try {
      const { channelId, resourceId, expiry } = await registerCalendarWatch(
        session.id
      );
      if (channelId) {
        await prisma.supplier.update({
          where: { id: session.id },
          data: {
            googleChannelId: channelId,
            googleResourceId: resourceId,
            googleChannelExpiry: expiry,
          },
        });
      }
    } catch (watchErr) {
      console.error("[POST /api/supplier/calendar/sync] watch", watchErr);
    }

    return NextResponse.json({
      success: true,
      data: { synced },
    });
  } catch (err) {
    console.error("[POST /api/supplier/calendar/sync]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
