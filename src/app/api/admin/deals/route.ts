import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error } = requireAdminSession(request);
  if (error) return error;
  try {
    const rows = await prisma.dealReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        supplier: { select: { name: true, phone: true, category: true } },
        customer: { select: { name: true, phone: true } },
      },
    });
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error("[GET /api/admin/deals]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
