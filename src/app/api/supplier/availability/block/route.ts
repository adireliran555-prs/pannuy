import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { invalidateAvailabilityCache } from "@/lib/availability";

export async function POST(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const body = await request.json();
    const { date, startTime, endTime } = body as {
      date?: string;
      startTime?: string;
      endTime?: string;
    };

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: "תאריך, שעת התחלה וסיום חובה" },
        { status: 400 }
      );
    }

    const slot = await prisma.availabilitySlot.create({
      data: {
        supplierId: session.id,
        date: new Date(date),
        startTime,
        endTime,
        isBlocked: true,
        source: "MANUAL",
      },
    });

    await invalidateAvailabilityCache(session.id);

    return NextResponse.json({ success: true, data: slot }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/supplier/availability/block]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
