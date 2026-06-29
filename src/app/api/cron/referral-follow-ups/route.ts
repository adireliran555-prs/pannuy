import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { APP_URL } from "@/lib/branding";
import { ReferralStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Hours/limits for the follow-up cadence.
const FIRST_FOLLOWUP_AFTER_H = 24; // first nudge 24h after the referral is created
const REPEAT_AFTER_H = 48; // subsequent nudges every 48h
const MAX_FOLLOWUPS = 3; // after this many with no reply → escalate to admin call

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function followUpText(supplierName: string | null, link: string): string {
  const who = supplierName ? ` עם ${supplierName}` : "";
  return `היי! רצינו לוודא שהצלחת ליצור קשר${who} דרך Top Eventer. עדכנו אותנו כאן: ${link}`;
}

/**
 * Drives the referral follow-up flow. Intended to run on a daily Vercel cron.
 * 1. NEW referrals older than 24h → send the first follow-up, mark AWAITING_REPLY.
 * 2. AWAITING_REPLY referrals quiet for 48h and under the cap → nudge again.
 * 3. AWAITING_REPLY referrals over the cap → mark NO_ANSWER (needs an admin call).
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let firstSent = 0;
  let repeatSent = 0;
  let escalated = 0;

  try {
    // ── 1 + 2: referrals due for a follow-up message ──
    const dueForFollowUp = await prisma.referral.findMany({
      where: {
        OR: [
          { status: ReferralStatus.NEW, createdAt: { lte: hoursAgo(FIRST_FOLLOWUP_AFTER_H) } },
          {
            status: ReferralStatus.AWAITING_REPLY,
            followUpCount: { lt: MAX_FOLLOWUPS },
            lastFollowUpAt: { lte: hoursAgo(REPEAT_AFTER_H) },
          },
        ],
      },
      take: 200,
      select: {
        id: true,
        status: true,
        followUpCount: true,
        customer: { select: { phone: true } },
        supplier: { select: { name: true } },
      },
    });

    for (const ref of dueForFollowUp) {
      const link = `${APP_URL}/r/${ref.id}`;
      if (ref.customer?.phone) {
        await sendSms(ref.customer.phone, followUpText(ref.supplier?.name ?? null, link));
      }
      await prisma.referral.update({
        where: { id: ref.id },
        data: {
          status: ReferralStatus.AWAITING_REPLY,
          followUpCount: { increment: 1 },
          lastFollowUpAt: now,
        },
      });
      if (ref.status === ReferralStatus.NEW) firstSent++;
      else repeatSent++;
    }

    // ── 3: exhausted follow-ups with no reply → escalate to an admin call ──
    const toEscalate = await prisma.referral.findMany({
      where: {
        status: ReferralStatus.AWAITING_REPLY,
        followUpCount: { gte: MAX_FOLLOWUPS },
        lastFollowUpAt: { lte: hoursAgo(REPEAT_AFTER_H) },
      },
      take: 200,
      select: { id: true },
    });

    for (const ref of toEscalate) {
      await prisma.referral.update({
        where: { id: ref.id },
        data: {
          status: ReferralStatus.NO_ANSWER,
          adminNotes: "אין מענה מהלקוח לאחר מספר תזכורות — דורש שיחת טלפון.",
        },
      });
      escalated++;
    }

    return NextResponse.json({
      success: true,
      firstSent,
      repeatSent,
      escalated,
    });
  } catch (err) {
    console.error("[cron/referral-follow-ups]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
