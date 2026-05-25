import { NextRequest, NextResponse } from "next/server";
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

    const availability = await getAvailabilityForMonth(slug, year, month);
    return NextResponse.json({ success: true, data: availability });
  } catch (err) {
    console.error("[GET /api/suppliers/[slug]/availability]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
