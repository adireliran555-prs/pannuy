import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAvailabilityForMonth } from "@/lib/availability";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = request.nextUrl;

    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1), 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: "שנה/חודש לא תקינים" },
        { status: 400 }
      );
    }

    // The path segment may be a slug or a raw supplier id — resolve to the id.
    const supplier = await prisma.supplier.findFirst({
      where: { OR: [{ id: slug }, { slug }] },
      select: { id: true },
    });
    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "ספק לא נמצא" },
        { status: 404 }
      );
    }

    const availability = await getAvailabilityForMonth(supplier.id, year, month);
    return NextResponse.json({ success: true, data: availability });
  } catch (err) {
    console.error("[GET /api/suppliers/[slug]/availability]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
