import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { CustomerSession, SupplierSession } from "@/types";

// ─── Response helpers ─────────────────────────────────────────────────────────

export function apiError(message: string, status: number): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

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

/**
 * Returns the session or throws a NextResponse 401.
 * Usage: const session = requireCustomer(request); — wrap in try/catch or handle the thrown response.
 * Callers that prefer the { session, error } pattern should use api-auth.ts instead.
 */
export function requireCustomer(request: NextRequest): CustomerSession & { type: "customer" } {
  const session = getCustomerSession(request);
  if (!session) throw apiError("Unauthorized", 401);
  return session;
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

/**
 * Returns the session or throws a NextResponse 401.
 */
export function requireSupplier(request: NextRequest): SupplierSession & { type: "supplier" } {
  const session = getSupplierSession(request);
  if (!session) throw apiError("Unauthorized", 401);
  return session;
}
