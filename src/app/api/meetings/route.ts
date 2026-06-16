import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/api-auth";
import { invalidateAvailabilityCache } from "@/lib/availability";
import { MeetingType, MeetingStatus, Prisma } from "@prisma/client";

// Sentinel used to bail out of the booking transaction when the requested slot
// is already taken. Caught below and translated to a 409.
const SLOT_TAKEN = "SLOT_TAKEN";

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

    // Validate time format and ordering server-side (don't trust the client).
    const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRe.test(startTime) || !timeRe.test(endTime) || endTime <= startTime) {
      return NextResponse.json(
        { success: false, error: "זמני הפגישה לא תקינים" },
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

    const dateObj = new Date(date);

    // Resolve affiliate referral from cookie
    const refCode = request.cookies.get("pannuy_ref")?.value ?? null;
    let referredBySupplierId: string | null = null;
    if (refCode) {
      const referrer = await prisma.supplier.findUnique({
        where: { affiliateCode: refCode },
        select: { id: true },
      });
      // Only attribute if the referrer is a different supplier than the one being booked
      if (referrer && referrer.id !== supplierId) {
        referredBySupplierId = referrer.id;
      }
    }

    // Availability check, meeting create, notification, and slot block all run
    // in ONE serializable transaction so two concurrent bookings for the same
    // (supplier, date, startTime) cannot both succeed. The DB's nullable
    // googleEventId unique index does not constrain MANUAL slots (NULLs are
    // distinct in Postgres), so we rely on SERIALIZABLE isolation: the
    // re-check + insert pair conflicts on overlapping writes and one tx aborts.
    let meeting;
    try {
      meeting = await prisma.$transaction(
        async (tx) => {
          // Re-check availability inside the tx with an OVERLAP test so a
          // covering block — a full-day block (00:00–23:59) or a multi-hour
          // block — also rejects the booking, not just an exact start-time match.
          const existingBlock = await tx.availabilitySlot.findFirst({
            where: {
              supplierId,
              date: dateObj,
              isBlocked: true,
              startTime: { lte: startTime },
              endTime: { gt: startTime },
            },
          });

          if (existingBlock) {
            throw new Error(SLOT_TAKEN);
          }

          // Block the slot to prevent double-booking. Created inside the tx so
          // it either commits atomically with the meeting or not at all.
          await tx.availabilitySlot.create({
            data: {
              supplierId,
              date: dateObj,
              startTime,
              endTime,
              isBlocked: true,
              source: "MANUAL",
            },
          });

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
              ...(referredBySupplierId ? { referredBySupplierId } : {}),
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
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (txErr) {
      // Either our explicit slot-taken bail-out, a unique-constraint hit, or a
      // serialization failure from a concurrent booking → the slot is taken.
      const isSlotTaken =
        (txErr instanceof Error && txErr.message === SLOT_TAKEN) ||
        (txErr instanceof Prisma.PrismaClientKnownRequestError &&
          (txErr.code === "P2002" || // unique constraint
            txErr.code === "P2034")); // transaction conflict / deadlock
      if (isSlotTaken) {
        return NextResponse.json(
          { success: false, error: "הזמן המבוקש כבר תפוס" },
          { status: 409 }
        );
      }
      throw txErr;
    }

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
