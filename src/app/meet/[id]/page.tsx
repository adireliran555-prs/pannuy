import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "crypto";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { logEvent, ActivityType } from "@/lib/activity";
import { formatHebrewDate } from "@/lib/utils";
import type { CustomerSession, SupplierSession } from "@/types";
import VideoRoom from "./VideoRoom";

export const metadata: Metadata = {
  title: "שיחת וידאו",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

function roomNameFor(meetingId: string): string {
  const salt = createHash("sha256")
    .update(meetingId + (process.env.JWT_SECRET ?? ""))
    .digest("hex")
    .slice(0, 8);
  return `topeventer-${meetingId}-${salt}`;
}

export default async function MeetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jar = await cookies();

  const customerToken = jar.get("pannuy_session")?.value;
  const supplierToken = jar.get("pannuy_supplier_session")?.value;
  const customer = customerToken ? (verifyToken(customerToken) as (CustomerSession & { type: string }) | null) : null;
  const supplier = supplierToken ? (verifyToken(supplierToken) as (SupplierSession & { type: string }) | null) : null;
  const customerId = customer?.type === "customer" ? customer.id : null;
  const supplierId = supplier?.type === "supplier" ? supplier.id : null;
  if (!customerId && !supplierId) redirect(`/start?returnTo=/meet/${id}`);

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      meetingType: true,
      requestedDate: true,
      startTime: true,
      endTime: true,
      customerId: true,
      supplierId: true,
      customer: { select: { name: true } },
      supplier: { select: { name: true } },
    },
  });

  const isCustomer = !!meeting && customerId === meeting.customerId;
  const isSupplier = !!meeting && supplierId === meeting.supplierId;
  const fallback = supplierId ? "/supplier/bookings" : "/dashboard/meetings";
  if (!meeting || (!isCustomer && !isSupplier)) redirect(fallback);
  if (meeting.status !== "CONFIRMED" || meeting.meetingType !== "VIDEO") redirect(fallback);

  const actorType = isCustomer ? "customer" : "supplier";
  const actorId = isCustomer ? meeting.customerId : meeting.supplierId;
  const displayName = (isCustomer ? customer?.name : supplier?.name) ?? (isCustomer ? "לקוח" : "ספק");

  const h = await headers();
  await logEvent({
    type: ActivityType.MEETING_VIDEO_JOINED,
    actorType,
    actorId,
    customerId: meeting.customerId,
    supplierId: meeting.supplierId,
    targetType: "meeting",
    targetId: meeting.id,
    payload: { role: actorType },
    meta: {
      ip: h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: h.get("user-agent")?.slice(0, 500) ?? null,
    },
  });

  return (
    <VideoRoom
      roomName={roomNameFor(meeting.id)}
      displayName={displayName}
      backHref={fallback}
      title={`${meeting.customer.name} ↔ ${meeting.supplier.name}`}
      subtitle={`${formatHebrewDate(meeting.requestedDate)} · ${meeting.startTime}–${meeting.endTime}`}
    />
  );
}
