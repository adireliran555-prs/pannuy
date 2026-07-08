import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { invalidateAvailabilityCache } from "@/lib/availability";
import { deleteCalendarEvent } from "@/lib/google-calendar";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const { id } = await params;

    const slot = await prisma.availabilitySlot.findUnique({ where: { id } });

    if (!slot) {
      return NextResponse.json(
        { success: false, error: "חסימה לא נמצאה" },
        { status: 404 }
      );
    }

    if (slot.supplierId !== session.id) {
      return NextResponse.json(
        { success: false, error: "אין הרשאה" },
        { status: 403 }
      );
    }

    // If this manual block was mirrored into Google Calendar, remove the event
    // there too (website → calendar sync), then clean up the GOOGLE slot that
    // the calendar watch echoed back so the date fully unblocks. Non-fatal.
    const mirroredToGoogle = slot.source === "MANUAL" && !!slot.googleEventId;
    if (mirroredToGoogle) {
      try {
        await deleteCalendarEvent(slot.supplierId, slot.googleEventId!);
      } catch (calErr) {
        console.warn(
          "[DELETE /api/supplier/availability/[id]] calendar delete failed:",
          calErr
        );
      }
    }

    await prisma.availabilitySlot.delete({ where: { id } });

    if (mirroredToGoogle) {
      const dateStr = slot.date.toISOString().slice(0, 10);
      await prisma.availabilitySlot.deleteMany({
        where: {
          supplierId: slot.supplierId,
          date: slot.date,
          source: "GOOGLE",
          googleEventId: {
            in: [`allday-${dateStr}`, `${dateStr}-${slot.startTime}`],
          },
        },
      });
    }

    await invalidateAvailabilityCache(session.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/supplier/availability/[id]]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
