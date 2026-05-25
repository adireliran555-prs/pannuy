import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { createCalendarEvent } from "@/lib/google-calendar";
import { invalidateAvailabilityCache } from "@/lib/availability";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const { action, notes } = body as {
      action?: "confirm" | "reject";
      notes?: string;
    };

    if (!action || !["confirm", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "action חייב להיות confirm או reject" },
        { status: 400 }
      );
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        customer: { select: { name: true, phone: true } },
        supplier: { select: { id: true, googleRefreshToken: true, slug: true } },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: "פגישה לא נמצאה" },
        { status: 404 }
      );
    }

    if (meeting.supplierId !== session.id) {
      return NextResponse.json(
        { success: false, error: "אין הרשאה" },
        { status: 403 }
      );
    }

    if (meeting.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "ניתן לפעול רק על פגישות בהמתנה" },
        { status: 400 }
      );
    }

    const newStatus = action === "confirm" ? "CONFIRMED" : "REJECTED";
    let googleEventId: string | null = meeting.googleEventId;

    // Create Google Calendar event if confirming and calendar is connected
    if (action === "confirm" && meeting.supplier.googleRefreshToken) {
      try {
        googleEventId = await createCalendarEvent(session.id, {
          date: meeting.requestedDate.toISOString().slice(0, 10),
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          customerName: meeting.customer.name,
          customerPhone: meeting.customer.phone,
          meetingType: meeting.meetingType,
          notes: meeting.customerNotes,
        });
      } catch (calErr) {
        console.warn("[supplier/meetings/[id]] Google Calendar create failed:", calErr);
        // Non-fatal — confirm the meeting anyway
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedMeeting = await tx.meeting.update({
        where: { id },
        data: {
          status: newStatus,
          ...(notes ? { supplierNotes: notes } : {}),
          ...(googleEventId ? { googleEventId } : {}),
        },
      });

      // Notify customer
      await tx.notification.create({
        data: {
          userId: meeting.customerId,
          type: action === "confirm" ? "MEETING_CONFIRMED" : "MEETING_REJECTED",
          titleHe: action === "confirm" ? "הפגישה אושרה!" : "הפגישה נדחתה",
          bodyHe:
            action === "confirm"
              ? `הפגישה שלכם ב-${meeting.requestedDate.toISOString().slice(0, 10)} אושרה`
              : `הפגישה שלכם ב-${meeting.requestedDate.toISOString().slice(0, 10)} נדחתה`,
          metadata: { meetingId: id },
        },
      });

      return updatedMeeting;
    });

    await invalidateAvailabilityCache(session.id);

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /api/supplier/meetings/[id]]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
