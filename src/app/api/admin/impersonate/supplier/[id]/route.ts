import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/api-auth";
import { signSupplierToken } from "@/lib/auth";

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminSession(request);
  if (error) return error;

  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) return NextResponse.json({ success: false, error: "not found" }, { status: 404 });

  const token = signSupplierToken({
    id: supplier.id,
    name: supplier.name,
    phone: supplier.phone,
    category: supplier.category,
    slug: supplier.slug,
  });

  const res = NextResponse.json({ success: true, redirect: "/supplier/dashboard" });
  res.cookies.set("pannuy_supplier_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  res.cookies.delete("pannuy_session");
  return res;
}
