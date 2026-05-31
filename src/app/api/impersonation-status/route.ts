import { NextRequest, NextResponse } from "next/server";
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
    return NextResponse.json({
      impersonating: true,
      kind: "customer" as const,
      label: customerPayload.name,
    });
  }
  if (supplierPayload?.type === "supplier") {
    return NextResponse.json({
      impersonating: true,
      kind: "supplier" as const,
      label: supplierPayload.name,
    });
  }
  return NextResponse.json({ impersonating: false });
}
