import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { CustomerSession, SupplierSession, AdminSession } from "@/types";

// ─── Customer auth ────────────────────────────────────────────────────────────

export function getCustomerSession(
  request: NextRequest
): (CustomerSession & { type: "customer" }) | null {
  const token = request.cookies.get("pannuy_session")?.value;
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || (decoded as { type: string }).type !== "customer") return null;

  return decoded as CustomerSession & { type: "customer" };
}

export function requireCustomerSession(
  request: NextRequest
):
  | { session: CustomerSession & { type: "customer" }; error: null }
  | { session: null; error: NextResponse } {
  const session = getCustomerSession(request);
  if (!session) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
  return { session, error: null };
}

// ─── Supplier auth ────────────────────────────────────────────────────────────

export function getSupplierSession(
  request: NextRequest
): (SupplierSession & { type: "supplier" }) | null {
  const token = request.cookies.get("pannuy_supplier_session")?.value;
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || (decoded as { type: string }).type !== "supplier") return null;

  return decoded as SupplierSession & { type: "supplier" };
}

export function requireSupplierSession(
  request: NextRequest
):
  | { session: SupplierSession & { type: "supplier" }; error: null }
  | { session: null; error: NextResponse } {
  const session = getSupplierSession(request);
  if (!session) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
  return { session, error: null };
}

// ─── Admin auth ───────────────────────────────────────────────────────────────

export function getAdminSession(
  request: NextRequest
): (AdminSession & { type: "admin" }) | null {
  const token = request.cookies.get("pannuy_admin_session")?.value;
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || (decoded as { type: string }).type !== "admin") return null;

  return decoded as AdminSession & { type: "admin" };
}

export function requireAdminSession(
  request: NextRequest
):
  | { session: AdminSession & { type: "admin" }; error: null }
  | { session: null; error: NextResponse } {
  const session = getAdminSession(request);
  if (!session) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
  return { session, error: null };
}
