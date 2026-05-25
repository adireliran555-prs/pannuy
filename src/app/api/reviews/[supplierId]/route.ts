import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const DEFAULT_LIMIT = 10;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const { supplierId } = await params;
    const { searchParams } = request.nextUrl;

    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { supplierId, isVisible: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          customer: { select: { name: true } },
        },
      }),
      prisma.review.count({ where: { supplierId, isVisible: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error("[GET /api/reviews/[supplierId]]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
