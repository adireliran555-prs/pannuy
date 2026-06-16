import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/api-auth";
import { invalidateAvailabilityCache } from "@/lib/availability";
import { deleteCalendarEvent } from "@/lib/google-calendar";
import { israelWallClockToInstant } from "@/lib/timezone";

const MIN_HOURS_BEFORE_CANCELLATION = 24;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const { id } = await params;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      select: {
        id: true,
        customerId: true,
        supplierId: true,
        status: true,
        requestedDate: true,
        startTime: true,
        googleEventId: true,
        supplier: { select: { name: true } },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: "פגישה לא נמצאה" },
        { status: 404 }
      );
    }

    if (meeting.customerId !== session.id) {
      return NextResponse.json(
        { success: false, error: "אין הרשאה" },
        { status: 403 }
      );
    }

    if (!["PENDING", "CONFIRMED"].includes(meeting.status)) {
      return NextResponse.json(
        { success: false, error: "לא ניתן לבטל פגישה בסטטוס הנוכחי" },
        { status: 400 }
      );
    }

    // Enforce 24h cancellation window — meeting time is Israel wall-clock.
    const meetingStart = israelWallClockToInstant(
      meeting.requestedDate.toISOString().slice(0, 10),
      meeting.startTime
    );
    const hoursUntilMeeting =
      (meetingStart.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilMeeting < MIN_HOURS_BEFORE_CANCELLATION) {
      return NextResponse.json(
        { success: false, error: "לא ניתן לבטל פחות מ-24 שעות לפני הפגישה" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.meeting.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      // Free the time back up: delete the MANUAL slot this booking created so
      // the slot can be rebooked. (GOOGLE slots are owned by calendar sync.)
      await tx.availabilitySlot.deleteMany({
        where: {
          supplierId: meeting.supplierId,
          date: meeting.requestedDate,
          startTime: meeting.startTime,
          source: "MANUAL",
        },
      });

      // If this booking carried a referral, void its still-PENDING earning so it
      // doesn't linger forever on the referrer's dashboard for a cancelled event.
      await tx.affiliateEarning.updateMany({
        where: { meetingId: id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });

      // Notify supplier
      await tx.notification.create({
        data: {
          supplierId: meeting.supplierId,
          type: "MEETING_CANCELLED",
          titleHe: "פגישה בוטלה",
          bodyHe: `${session.name} ביטל את הפגישה`,
          metadata: { meetingId: id },
        },
      });
    });

    // Remove the Google Calendar event if one was created. Non-fatal.
    if (meeting.googleEventId) {
      try {
        await deleteCalendarEvent(meeting.supplierId, meeting.googleEventId);
      } catch (calErr) {
        console.warn("[meetings/[id]/cancel] Google Calendar delete failed:", calErr);
      }
    }

    await invalidateAvailabilityCache(meeting.supplierId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/meetings/[id]/cancel]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
