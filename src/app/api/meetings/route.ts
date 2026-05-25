import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/api-auth";
import { invalidateAvailabilityCache } from "@/lib/availability";
import { MeetingType, MeetingStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const body = await request.json();
    const {
      supplierId,
      date,
      startTime,
      endTime,
      meetingType,
      notes,
    } = body as {
      supplierId?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      meetingType?: string;
      notes?: string;
    };

    if (!supplierId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: "שדות חסרים" },
        { status: 400 }
      );
    }

    const validMeetingType =
      meetingType && Object.values(MeetingType).includes(meetingType as MeetingType)
        ? (meetingType as MeetingType)
        : MeetingType.VIDEO;

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, isActive: true, slug: true },
    });

    if (!supplier || !supplier.isActive) {
      return NextResponse.json(
        { success: false, error: "ספק לא נמצא" },
        { status: 404 }
      );
    }

    // Re-check slot availability in DB (not cache)
    const dateObj = new Date(date);
    const existingBlock = await prisma.availabilitySlot.findFirst({
      where: {
        supplierId,
        date: dateObj,
        startTime,
        isBlocked: true,
      },
    });

    if (existingBlock) {
      return NextResponse.json(
        { success: false, error: "הזמן המבוקש כבר תפוס" },
        { status: 409 }
      );
    }

    // Create meeting + notification atomically
    const meeting = await prisma.$transaction(async (tx) => {
      const newMeeting = await tx.meeting.create({
        data: {
          customerId: session.id,
          supplierId,
          requestedDate: dateObj,
          startTime,
          endTime,
          status: MeetingStatus.PENDING,
          meetingType: validMeetingType,
          customerNotes: notes ?? null,
        },
        include: {
          supplier: {
            select: { name: true, slug: true },
          },
          customer: {
            select: { name: true, phone: true },
          },
        },
      });

      // Notify supplier
      await tx.notification.create({
        data: {
          supplierId,
          type: "MEETING_REQUEST",
          titleHe: "בקשת פגישה חדשה",
          bodyHe: `${session.name} ביקש פגישה ב-${date} בשעה ${startTime}`,
          metadata: { meetingId: newMeeting.id },
        },
      });

      return newMeeting;
    });

    // Block the slot to prevent double-booking
    await prisma.availabilitySlot.create({
      data: {
        supplierId,
        date: dateObj,
        startTime,
        endTime,
        isBlocked: true,
        source: "MANUAL",
      },
    }).catch(() => {
      // Slot might already exist — ignore unique constraint errors
    });

    await invalidateAvailabilityCache(supplierId);

    return NextResponse.json({ success: true, data: meeting }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/meetings]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const { searchParams } = request.nextUrl;
    const statusParam = searchParams.get("status");
    const validStatuses = ["PENDING", "CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED"];
    const statusFilter =
      statusParam && validStatuses.includes(statusParam)
        ? { status: statusParam as MeetingStatus }
        : {};

    const meetings = await prisma.meeting.findMany({
      where: {
        customerId: session.id,
        ...statusFilter,
      },
      orderBy: { requestedDate: "desc" },
      include: {
        supplier: {
          select: {
            id: true,
            slug: true,
            name: true,
            category: true,
            city: true,
            photos: {
              where: { type: "PROFILE" },
              take: 1,
            },
          },
        },
        review: { select: { id: true, rating: true } },
      },
    });

    return NextResponse.json({ success: true, data: meetings });
  } catch (err) {
    console.error("[GET /api/meetings]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
