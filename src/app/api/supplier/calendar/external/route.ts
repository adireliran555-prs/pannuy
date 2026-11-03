import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import {
  normalizeIcsUrl,
  syncExternalCalendar,
  clearExternalCalendar,
} from "@/lib/external-calendar";

const bodySchema = z.object({
  url: z.string().min(8).max(2000),
  provider: z.enum(["ICLOUD", "OUTLOOK"]),
});

export async function PUT(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "קישור וסוג יומן חובה" }, { status: 400 });
    }
    const url = normalizeIcsUrl(parsed.data.url);
    if (!url) {
      return NextResponse.json(
        { success: false, error: "הקישור אינו תקין. הדביקו קישור ציבורי ליומן (webcal:// או https://)" },
        { status: 400 }
      );
    }

    await prisma.supplier.update({
      where: { id: session.id },
      data: { externalCalendarUrl: url, externalCalendarProvider: parsed.data.provider },
    });

    try {
      const { synced } = await syncExternalCalendar(session.id);
      return NextResponse.json({ success: true, data: { synced } });
    } catch (syncErr) {
      console.error("[PUT /api/supplier/calendar/external] first sync", syncErr);
      // Roll back so the supplier isn't left with a broken link saved.
      await prisma.supplier.update({
        where: { id: session.id },
        data: { externalCalendarUrl: null, externalCalendarProvider: null },
      });
      return NextResponse.json(
        { success: false, error: "לא הצלחנו לקרוא את היומן מהקישור. ודאו שהיומן משותף כציבורי ונסו שוב" },
        { status: 422 }
      );
    }
  } catch (err) {
    console.error("[PUT /api/supplier/calendar/external]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;
    await clearExternalCalendar(session.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/supplier/calendar/external]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
