import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";
import { invalidateAvailabilityCache } from "@/lib/availability";
import { REFERRAL_COMMISSION_ILS } from "@/lib/payments";
import { computeCommissionIls, computeAgentCommissionIls, commissionRateFor, formatRate } from "@/lib/commission";
import { israelWallClockToInstant } from "@/lib/timezone";
import { formatHebrewDate } from "@/lib/utils";
import { z } from "zod";
import { logEventAsync, requestMeta, ActivityType } from "@/lib/activity";

const patchSchema = z.object({
  action: z.enum(["confirm", "reject", "complete"]),
  notes: z.string().max(2000).optional(),
  // Deal value (ILS, pre-VAT) reported on completion — commission is a % of it.
  dealAmountIls: z.number().int().min(0).max(10_000_000).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "action חייב להיות confirm, reject או complete" },
        { status: 400 }
      );
    }
    const { action, notes, dealAmountIls } = parsed.data;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        customer: { select: { name: true, phone: true, referredByAgentId: true } },
        supplier: {
          select: {
            id: true,
            googleRefreshToken: true,
            slug: true,
            category: true,
            referredByAgentId: true,
          },
        },
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
      // The event must actually be over before commission is released.
      const eventEnd = israelWallClockToInstant(
        meeting.requestedDate.toISOString().slice(0, 10),
        meeting.endTime
      );
      if (eventEnd.getTime() >= Date.now()) {
        return NextResponse.json(
          { success: false, error: "לא ניתן לסמן כהושלם לפני מועד האירוע" },
          { status: 400 }
        );
      }
      if (dealAmountIls === undefined) {
        return NextResponse.json(
          { success: false, error: "יש להזין את סכום העסקה (לפני מע\"מ)" },
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
      let agentEarningInfo: { agentId: string; amountIls: number } | null = null;
      const completed = await prisma.$transaction(async (tx) => {
        const deal = dealAmountIls ?? 0;
        const commissionIls = computeCommissionIls(meeting.supplier.category, deal);
        const updatedMeeting = await tx.meeting.update({
          where: { id },
          data: {
            status: "COMPLETED",
            dealAmountIls: deal,
            commissionIls,
            ...(notes ? { supplierNotes: notes } : {}),
          },
        });

        // The performing supplier owes us a platform commission for this job
        // (% of the deal by category). Recorded as PENDING; collected once a
        // payment provider is wired.
        if (commissionIls > 0) {
          await tx.paymentTransaction.create({
            data: {
              supplierId: session.id,
              type: "COMMISSION",
              amountIls: commissionIls,
              status: "PENDING",
              meetingId: id,
              note: `עמלת פלטפורמה ${formatRate(commissionRateFor(meeting.supplier.category))} מעסקה של ₪${deal.toLocaleString("he-IL")}`,
            },
          });
        }

        // Agent (סוכן) referral: the customer's agent takes priority over the
        // supplier's. One earning per meeting; CONFIRMED immediately since the
        // event already happened.
        const agentId = meeting.customer.referredByAgentId ?? meeting.supplier.referredByAgentId;
        const agentIls = computeAgentCommissionIls(deal);
        if (agentId && agentIls > 0) {
          agentEarningInfo = { agentId, amountIls: agentIls };
          await tx.agentEarning.upsert({
            where: { meetingId: id },
            create: { agentId, meetingId: id, amountIls: agentIls, status: "CONFIRMED" },
            update: {},
          });
        }

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
              bodyHe: `האירוע שהפניתם התקיים — ₪${earning.amountIls} נזקפו ליתרה שלכם`,
              metadata: { meetingId: id },
            },
          });
        }

        return updatedMeeting;
      });

      const meta = requestMeta(request);
      logEventAsync({
        type: ActivityType.MEETING_COMPLETED,
        actorType: "supplier",
        actorId: session.id,
        customerId: meeting.customerId,
        supplierId: session.id,
        targetType: "meeting",
        targetId: id,
        payload: {
          dealAmountIls: completed.dealAmountIls,
          commissionIls: completed.commissionIls,
          notes: notes ?? null,
          customerPhone: meeting.customer.phone,
        },
        meta,
      });
      if (agentEarningInfo) {
        logEventAsync({
          type: ActivityType.AGENT_EARNING_CREATED,
          actorType: "system",
          customerId: meeting.customerId,
          supplierId: session.id,
          targetType: "meeting",
          targetId: id,
          payload: agentEarningInfo,
          meta,
        });
      }

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
      // booking created so it can be rebooked, plus any GOOGLE mirror of it.
      if (action === "reject") {
        await tx.availabilitySlot.deleteMany({
          where: {
            supplierId: meeting.supplierId,
            date: meeting.requestedDate,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            OR: [
              { source: "MANUAL" },
              { source: "GOOGLE" },
            ],
          },
        });
        if (meeting.googleEventId) {
          await tx.availabilitySlot.deleteMany({
            where: { supplierId: meeting.supplierId, googleEventId: meeting.googleEventId },
          });
        }
      }

      // Notify customer
      await tx.notification.create({
        data: {
          userId: meeting.customerId,
          type: action === "confirm" ? "MEETING_CONFIRMED" : "MEETING_REJECTED",
          titleHe: action === "confirm" ? "הפגישה אושרה!" : "הפגישה נדחתה",
          bodyHe:
            action === "confirm"
              ? `הפגישה שלכם ב־${formatHebrewDate(meeting.requestedDate)} אושרה`
              : `הפגישה שלכם ב־${formatHebrewDate(meeting.requestedDate)} נדחתה`,
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
            amountIls: REFERRAL_COMMISSION_ILS,
            status: "PENDING",
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

    logEventAsync({
      type: action === "confirm" ? ActivityType.MEETING_CONFIRMED : ActivityType.MEETING_REJECTED,
      actorType: "supplier",
      actorId: session.id,
      customerId: meeting.customerId,
      supplierId: session.id,
      targetType: "meeting",
      targetId: id,
      payload: {
        notes: notes ?? null,
        requestedDate: meeting.requestedDate.toISOString().slice(0, 10),
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        // Confirming reveals the customer's phone to the supplier.
        ...(action === "confirm" ? { customerPhone: meeting.customer.phone, customerName: meeting.customer.name } : {}),
      },
      meta: requestMeta(request),
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /api/supplier/meetings/[id]]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
