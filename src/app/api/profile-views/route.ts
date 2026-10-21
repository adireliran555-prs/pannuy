import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerSession } from "@/lib/api-auth";
import { clientIp } from "@/lib/otp-ip-limit";

const SOURCE_ALLOWLIST = new Set(["profile", "search", "saved", "plan", "share", "referral"]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const supplierId = body?.supplierId;
    const rawSource = body?.source;
    if (typeof supplierId !== "string" || !supplierId || supplierId.length > 64) {
      return NextResponse.json({ success: false, error: "missing supplierId" }, { status: 400 });
    }
    const source =
      typeof rawSource === "string" && SOURCE_ALLOWLIST.has(rawSource) ? rawSource : null;

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true },
    });
    if (!supplier) {
      return NextResponse.json({ success: false, error: "ספק לא נמצא" }, { status: 404 });
    }

    const session = getCustomerSession(request);

    // Dedupe: one view per supplier + viewer (customer id, else IP) per hour.
    const ip = clientIp(request);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await prisma.profileView.findFirst({
      where: {
        supplierId,
        createdAt: { gte: hourAgo },
        ...(session?.id ? { customerId: session.id } : { customerId: null, source: `${source ?? "unknown"}|ip:${ip}` }),
      },
      select: { id: true },
    });
    if (recent) return NextResponse.json({ success: true, deduped: true });

    await prisma.profileView.create({
      data: {
        supplierId,
        customerId: session?.id ?? null,
        // Anonymous views carry the IP in `source` so the hourly dedupe works
        // without a schema change; authenticated views store the plain source.
        source: session?.id ? source : `${source ?? "unknown"}|ip:${ip}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/profile-views]", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
