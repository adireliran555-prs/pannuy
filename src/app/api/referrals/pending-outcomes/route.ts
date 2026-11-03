import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/api-auth";

const MIN_AGE_DAYS = 3;

// Referrals where we still don't know what happened — shown to the customer as
// "did you talk to X? what happened?" prompts.
export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const rows = await prisma.referral.findMany({
      where: {
        customerId: session.id,
        customerOutcome: null,
        createdAt: { lte: new Date(Date.now() - MIN_AGE_DAYS * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "asc" },
      take: 10,
      select: {
        id: true,
        channel: true,
        status: true,
        createdAt: true,
        supplier: { select: { name: true, slug: true, category: true } },
      },
    });

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error("[GET /api/referrals/pending-outcomes]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
