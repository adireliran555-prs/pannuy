import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { MeetingStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const { searchParams } = request.nextUrl;
    const statusParam = searchParams.get("status");
    const validStatuses = Object.values(MeetingStatus);
    const statusFilter =
      statusParam && validStatuses.includes(statusParam as MeetingStatus)
        ? { status: statusParam as MeetingStatus }
        : {};

    const meetings = await prisma.meeting.findMany({
      where: {
        supplierId: session.id,
        ...statusFilter,
      },
      orderBy: { requestedDate: "asc" },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, weddingDate: true, weddingArea: true },
        },
        review: { select: { id: true, rating: true } },
      },
    });

    return NextResponse.json({ success: true, data: meetings });
  } catch (err) {
    console.error("[GET /api/supplier/meetings]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
