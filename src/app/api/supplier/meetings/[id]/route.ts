import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";
import { invalidateAvailabilityCache } from "@/lib/availability";
import { chargeDeposit, PLATFORM_COMMISSION_ILS } from "@/lib/payments";

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
      action?: "confirm" | "reject" | "complete";
      notes?: string;
    };

    if (!action || !["confirm", "reject", "complete"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "action חייב להיות confirm, reject או complete" },
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

    // confirm/reject act on PENDING requests; complete acts on a CONFIRMED booking
    // once the event has actually taken place (this is what releases referral money).
    if (action === "complete") {
      if (meeting.status !== "CONFIRMED") {
        return NextResponse.json(
          { success: false, error: "ניתן לסמן כהושלם רק אירוע מאושר" },
          { status: 400 }
        );
      }
    } else if (meeting.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "ניתן לפעול רק על פגישות בהמתנה" },
        { status: 400 }
      );
    }

    // ── complete: the event happened. Release the referral commission by flipping
    // its AffiliateEarning from PENDING → CONFIRMED so it counts toward the
    // referrer's withdrawable balance. Notify the referrer.
    if (action === "complete") {
      const completed = await prisma.$transaction(async (tx) => {
        const updatedMeeting = await tx.meeting.update({
          where: { id },
          data: { status: "COMPLETED", ...(notes ? { supplierNotes: notes } : {}) },
        });

        // The performing supplier owes us a platform commission for this job.
        // Recorded as PENDING; collected once a payment provider is wired.
        await tx.paymentTransaction.create({
          data: {
            supplierId: session.id,
            type: "COMMISSION",
            amountIls: PLATFORM_COMMISSION_ILS,
            status: "PENDING",
            meetingId: id,
            note: "עמלת פלטפורמה לאירוע שהושלם",
          },
        });

        const earning = await tx.affiliateEarning.findUnique({
          where: { meetingId: id },
          select: { id: true, referringSupplierId: true, amountIls: true, status: true },
        });

        if (earning && earning.status === "PENDING") {
          await tx.affiliateEarning.update({
            where: { id: earning.id },
            data: { status: "CONFIRMED" },
          });
          await tx.notification.create({
            data: {
              supplierId: earning.referringSupplierId,
              type: "AFFILIATE_EARNED",
              titleHe: "עמלת הפניה זמינה למשיכה 💰",
              bodyHe: `האירוע שהפנית התקיים — ₪${earning.amountIls} נזקפו ליתרה שלך`,
              metadata: { meetingId: id },
            },
          });
        }

        return updatedMeeting;
      });

      return NextResponse.json({ success: true, data: completed });
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

    // Attempt to charge the deposit on confirm. Non-fatal: a failure must not
    // block confirmation — we record the PaymentTransaction as PENDING instead.
    // Package price is not reliably known here, so we use 0 as a placeholder.
    const depositAmountIls = 0;
    let depositResult: { ok: boolean; providerRef?: string } = { ok: false };
    if (action === "confirm") {
      try {
        depositResult = await chargeDeposit({
          amountIls: depositAmountIls,
          meetingId: meeting.id,
          customerName: meeting.customer.name,
        });
      } catch (payErr) {
        console.warn("[supplier/meetings/[id]] chargeDeposit failed:", payErr);
        // Non-fatal — record as PENDING below.
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

      // On reject, free the time back up: delete the MANUAL slot the customer's
      // booking created so it can be rebooked. (GOOGLE slots are owned by sync.)
      if (action === "reject") {
        await tx.availabilitySlot.deleteMany({
          where: {
            supplierId: meeting.supplierId,
            date: meeting.requestedDate,
            startTime: meeting.startTime,
            source: "MANUAL",
          },
        });
      }

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

      // Create the affiliate earning when a referred booking is confirmed, but
      // keep it PENDING — the referrer only gets the money once the event has
      // actually happened and the performing supplier marks it complete.
      if (action === "confirm" && meeting.referredBySupplierId) {
        await tx.affiliateEarning.create({
          data: {
            referringSupplierId: meeting.referredBySupplierId,
            receivingSupplierId: session.id,
            meetingId: meeting.id,
            amountIls: 300,
            status: "PENDING",
          },
        });
      }

      // Record a deposit payment transaction on confirm
      if (action === "confirm") {
        await tx.paymentTransaction.create({
          data: {
            supplierId: session.id,
            type: "DEPOSIT",
            amountIls: depositAmountIls,
            status: depositResult.ok ? "COMPLETED" : "PENDING",
            provider: "PAYPLUS",
            providerRef: depositResult.providerRef ?? null,
            meetingId: meeting.id,
            ...(depositResult.ok ? { settledAt: new Date() } : {}),
          },
        });
      }

      return updatedMeeting;
    });

    // On reject, remove the Google Calendar event if one exists. Non-fatal.
    if (action === "reject" && meeting.googleEventId) {
      try {
        await deleteCalendarEvent(meeting.supplierId, meeting.googleEventId);
      } catch (calErr) {
        console.warn("[supplier/meetings/[id]] Google Calendar delete failed:", calErr);
      }
    }

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
