import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/api-auth";
import { signCustomerToken } from "@/lib/auth";
import { logAdminAction } from "@/lib/activity-admin";

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminSession(request);
  if (error) return error;

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ success: false, error: "not found" }, { status: 404 });

  const token = signCustomerToken({
    id: user.id,
    name: user.name,
    phone: user.phone,
    weddingDate: user.weddingDate?.toISOString() ?? null,
    weddingArea: user.weddingArea ?? null,
  });

  logAdminAction(request, { route: "/api/admin/impersonate/customer/[id]", targetType: "customer", targetId: id, customerId: id });
  const res = NextResponse.json({ success: true, redirect: "/dashboard/meetings" });
  res.cookies.set("pannuy_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  // Don't touch the admin cookie — we want both active so the banner appears.
  res.cookies.delete("pannuy_supplier_session");
  return res;
}
