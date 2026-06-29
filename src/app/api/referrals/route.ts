import { NextRequest, NextResponse } from "next/server";
import { requireCustomerSession } from "@/lib/api-auth";
import { createOrUpdateReferral } from "@/lib/referrals";
import { ReferralChannel } from "@prisma/client";
import prisma from "@/lib/prisma";

// Records a referral when a customer contacts a supplier off-platform (WhatsApp).
// Called right before opening WhatsApp from the supplier profile.
export async function POST(request: NextRequest) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const { supplierId, channel } = body as {
      supplierId?: string;
      channel?: string;
    };

    if (!supplierId) {
      return NextResponse.json(
        { success: false, error: "supplierId חובה" },
        { status: 400 }
      );
    }

    const resolvedChannel =
      channel && Object.values(ReferralChannel).includes(channel as ReferralChannel)
        ? (channel as ReferralChannel)
        : ReferralChannel.WHATSAPP;

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true },
    });
    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "ספק לא נמצא" },
        { status: 404 }
      );
    }

    const result = await createOrUpdateReferral({
      customerId: session.id,
      customerName: session.name,
      supplierId,
      channel: resolvedChannel,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/referrals]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
