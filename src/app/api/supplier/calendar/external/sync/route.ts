import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { syncExternalCalendar } from "@/lib/external-calendar";

export async function POST(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const supplier = await prisma.supplier.findUnique({
      where: { id: session.id },
      select: { externalCalendarUrl: true },
    });
    if (!supplier?.externalCalendarUrl) {
      return NextResponse.json({ success: false, error: "לא חובר יומן iPhone/Outlook" }, { status: 400 });
    }

    const { synced } = await syncExternalCalendar(session.id);
    return NextResponse.json({ success: true, data: { synced } });
  } catch (err) {
    console.error("[POST /api/supplier/calendar/external/sync]", err);
    return NextResponse.json(
      { success: false, error: "הסנכרון נכשל. ודאו שהיומן עדיין משותף כציבורי" },
      { status: 502 }
    );
  }
}
