// Platform → supplier referral (lead) tracking.
//
// A Referral is created every time we connect a customer to a supplier — whether
// they booked a meeting in-app or tapped WhatsApp from the profile. This lets us
// follow up with the customer, escalate to an admin call when there's no reply,
// and know the outcome of every referral we make.

import prisma from "@/lib/prisma";
import { ReferralChannel, ReferralStatus } from "@prisma/client";

// Statuses where the lead is still "live" — we reuse one of these instead of
// opening a duplicate when the same customer contacts the same supplier again.
const OPEN_STATUSES: ReferralStatus[] = [
  ReferralStatus.NEW,
  ReferralStatus.AWAITING_REPLY,
  ReferralStatus.CONNECTED,
];

export interface CreateReferralInput {
  customerId: string;
  customerName?: string | null;
  supplierId: string;
  channel: ReferralChannel;
  meetingId?: string | null;
}

/**
 * Records (or updates) a referral and notifies the supplier they have a lead.
 * Deduplicates against a recent open referral for the same customer+supplier so
 * a customer who WhatsApps and then books doesn't generate two leads.
 * Returns the referral id, or null on bad input.
 */
export async function createOrUpdateReferral(
  input: CreateReferralInput
): Promise<{ id: string; created: boolean } | null> {
  const { customerId, supplierId, channel, meetingId } = input;
  if (!customerId || !supplierId) return null;

  const existing = await prisma.referral.findFirst({
    where: { customerId, supplierId, status: { in: OPEN_STATUSES } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (existing) {
    await prisma.referral.update({
      where: { id: existing.id },
      data: {
        // An in-app booking is a stronger signal than a WhatsApp tap.
        ...(channel === ReferralChannel.IN_APP ? { channel } : {}),
        ...(meetingId ? { meetingId } : {}),
      },
    });
    return { id: existing.id, created: false };
  }

  const referral = await prisma.referral.create({
    data: { customerId, supplierId, channel, meetingId: meetingId ?? null },
    select: { id: true },
  });

  await prisma.notification.create({
    data: {
      supplierId,
      type: "NEW_LEAD",
      titleHe: "ליד חדש 🎯",
      bodyHe: input.customerName
        ? `${input.customerName} מתעניין/ת בשירות שלך. הקשר נעשה דרך האתר.`
        : "לקוח/ה חדש/ה מתעניין/ת בשירות שלך. הקשר נעשה דרך האתר.",
      metadata: { referralId: referral.id, channel },
    },
  });

  return { id: referral.id, created: true };
}
