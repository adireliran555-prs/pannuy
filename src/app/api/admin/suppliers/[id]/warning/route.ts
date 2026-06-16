import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminSession(request);
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const reasonHe = typeof body.reasonHe === "string" ? body.reasonHe.trim() : "";
  if (!reasonHe) {
    return NextResponse.json(
      { success: false, error: "חובה לציין סיבה לאזהרה" },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.supplier.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!existing) return null;

      await tx.supplierWarning.create({
        data: { supplierId: id, reasonHe },
      });

      const updated = await tx.supplier.update({
        where: { id },
        data: { warningCount: { increment: 1 } },
        select: { warningCount: true },
      });

      const deactivated = updated.warningCount >= 2;
      if (deactivated) {
        await tx.supplier.update({
          where: { id },
          data: { isActive: false },
        });
      }

      return { warningCount: updated.warningCount, deactivated };
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: "ספק לא נמצא" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      warningCount: result.warningCount,
      deactivated: result.deactivated,
    });
  } catch (err) {
    console.error("[POST /api/admin/suppliers/[id]/warning]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminSession(request);
  if (error) return error;

  const { id } = await params;

  try {
    const warnings = await prisma.supplierWarning.findMany({
      where: { supplierId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, warnings });
  } catch (err) {
    console.error("[GET /api/admin/suppliers/[id]/warning]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
