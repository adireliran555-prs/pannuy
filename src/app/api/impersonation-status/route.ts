import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// Public endpoint (lightweight). Returns whether the current cookies indicate
// that an admin is currently impersonating a customer or supplier. Used by the
// client-side ImpersonationBanner so the root layout can stay statically
// renderable.
export async function GET(request: NextRequest) {
  const adminToken = request.cookies.get("pannuy_admin_session")?.value;
  if (!adminToken) return NextResponse.json({ impersonating: false });

  const adminPayload = verifyToken(adminToken);
  if (!adminPayload || adminPayload.type !== "admin") {
    return NextResponse.json({ impersonating: false });
  }

  const customerToken = request.cookies.get("pannuy_session")?.value;
  const supplierToken = request.cookies.get("pannuy_supplier_session")?.value;

  const customerPayload = customerToken ? verifyToken(customerToken) : null;
  const supplierPayload = supplierToken ? verifyToken(supplierToken) : null;

  if (customerPayload?.type === "customer") {
    const customer = await prisma.user.findUnique({
      where: { id: customerPayload.id },
      select: { name: true },
    });
    if (!customer) {
      const res = NextResponse.json({ impersonating: false, redirect: "/admin" });
      res.cookies.delete("pannuy_session");
      return res;
    }
    return NextResponse.json({
      impersonating: true,
      kind: "customer" as const,
      label: customer.name,
    });
  }

  if (supplierPayload?.type === "supplier") {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierPayload.id },
      select: { name: true },
    });
    if (!supplier) {
      const res = NextResponse.json({ impersonating: false, redirect: "/admin" });
      res.cookies.delete("pannuy_supplier_session");
      return res;
    }
    return NextResponse.json({
      impersonating: true,
      kind: "supplier" as const,
      label: supplier.name,
    });
  }

  return NextResponse.json({ impersonating: false });
}
