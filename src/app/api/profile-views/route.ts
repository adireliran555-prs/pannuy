import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerSession } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const supplierId = body?.supplierId;
    const source = body?.source;
    if (typeof supplierId !== "string" || !supplierId) {
      return NextResponse.json({ success: false, error: "missing supplierId" }, { status: 400 });
    }

    const session = getCustomerSession(request);

    await prisma.profileView.create({
      data: {
        supplierId,
        customerId: session?.id ?? null,
        source: typeof source === "string" ? source : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/profile-views]", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
