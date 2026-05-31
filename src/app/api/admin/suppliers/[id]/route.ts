import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminSession(request);
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const data: { isVerified?: boolean; isActive?: boolean } = {};
  if (typeof body.isVerified === "boolean") data.isVerified = body.isVerified;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ success: false, error: "no fields" }, { status: 400 });
  }

  try {
    const supplier = await prisma.supplier.update({ where: { id }, data });
    return NextResponse.json({ success: true, supplier: { id: supplier.id, ...data } });
  } catch (err) {
    console.error("[PATCH /api/admin/suppliers/[id]]", err);
    return NextResponse.json({ success: false, error: "שגיאה" }, { status: 500 });
  }
}
