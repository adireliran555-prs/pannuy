import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { normalizeIsraeliPhone } from "@/lib/utils";
import { computeCommissionIls, commissionRateFor } from "@/lib/commission";
import { logEventAsync, requestMeta, ActivityType } from "@/lib/activity";
import { ReferralStatus } from "@prisma/client";
import { z } from "zod";

const OPEN_STATUSES: ReferralStatus[] = [
  ReferralStatus.NEW,
  ReferralStatus.AWAITING_REPLY,
  ReferralStatus.CONNECTED,
  ReferralStatus.NO_ANSWER,
];

const createSchema = z.object({
  customerPhone: z.string().max(20).optional(),
  customerName: z.string().trim().max(100).optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  amountIls: z.number().int().min(1).max(10_000_000),
  note: z.string().trim().max(2000).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;
    const reports = await prisma.dealReport.findMany({
      where: { supplierId: session.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, customerName: true, customerPhone: true, eventDate: true,
        amountIls: true, commissionIls: true, status: true, note: true, createdAt: true,
        customer: { select: { name: true } },
      },
    });
    return NextResponse.json({ success: true, data: reports });
  } catch (err) {
    console.error("[GET /api/supplier/deals]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}

// A supplier reports a deal that closed off-platform (no in-app meeting). This is
// the compliant path for the commission obligation in the supplier agreement.
export async function POST(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "יש להזין סכום עסקה תקין" }, { status: 400 });
    }
    const { customerPhone, customerName, eventDate, amountIls, note } = parsed.data;

    const phone = customerPhone ? normalizeIsraeliPhone(customerPhone) : null;
    if (customerPhone && !phone) {
      return NextResponse.json({ success: false, error: "מספר טלפון לא תקין" }, { status: 400 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: session.id },
      select: { category: true },
    });
    if (!supplier) {
      return NextResponse.json({ success: false, error: "ספק לא נמצא" }, { status: 404 });
    }

    const customer = phone
      ? await prisma.user.findUnique({ where: { phone }, select: { id: true, name: true } })
      : null;

    const referral = customer
      ? await prisma.referral.findFirst({
          where: { customerId: customer.id, supplierId: session.id, status: { in: OPEN_STATUSES } },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        })
      : null;

    const commissionIls = computeCommissionIls(supplier.category, amountIls);

    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.dealReport.create({
        data: {
          supplierId: session.id,
          customerId: customer?.id ?? null,
          customerName: customerName || customer?.name || null,
          customerPhone: phone,
          eventDate: eventDate ? new Date(eventDate) : null,
          amountIls,
          commissionIls,
          note: note || null,
          referralId: referral?.id ?? null,
        },
      });
      if (commissionIls > 0) {
        await tx.paymentTransaction.create({
          data: {
            supplierId: session.id,
            type: "COMMISSION",
            amountIls: commissionIls,
            status: "PENDING",
            note: `עמלה על עסקה שדווחה ידנית (${created.id})`,
          },
        });
      }
      if (referral) {
        await tx.referral.update({
          where: { id: referral.id },
          data: { status: ReferralStatus.CONVERTED, convertedAt: new Date() },
        });
      }
      return created;
    });

    logEventAsync({
      type: ActivityType.DEAL_REPORTED,
      actorType: "supplier",
      actorId: session.id,
      customerId: customer?.id ?? null,
      supplierId: session.id,
      targetType: "DealReport",
      targetId: report.id,
      payload: {
        amountIls,
        commissionIls,
        rate: commissionRateFor(supplier.category),
        customerPhone: phone,
        customerName: report.customerName,
        eventDate: eventDate ?? null,
        matchedCustomer: !!customer,
        referralId: referral?.id ?? null,
      },
      meta: requestMeta(request),
    });

    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/supplier/deals]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
