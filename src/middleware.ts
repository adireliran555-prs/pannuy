import { NextRequest, NextResponse } from "next/server";

const CUSTOMER_PROTECTED_PREFIXES = ["/dashboard"];
const SUPPLIER_PROTECTED_PREFIXES = [
  "/supplier/dashboard",
  "/supplier/bookings",
  "/supplier/profile",
  "/supplier/calendar",
  "/supplier/packages",
];
// /admin protected, but /admin/login is not.
const ADMIN_PROTECTED_PREFIX = "/admin";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (CUSTOMER_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const token = request.cookies.get("pannuy_session")?.value;
    if (!token) return NextResponse.redirect(new URL("/start", request.url));
    const payload = decodeJwtPayload(token);
    if (!payload || payload.type !== "customer") {
      const res = NextResponse.redirect(new URL("/start", request.url));
      res.cookies.delete("pannuy_session");
      return res;
    }
    return NextResponse.next();
  }

  // Admin gating — block /admin/* (except /admin/login) without a valid admin cookie
  if (pathname.startsWith(ADMIN_PROTECTED_PREFIX) && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get("pannuy_admin_session")?.value;
    if (!token) return NextResponse.redirect(new URL("/admin/login", request.url));
    const payload = decodeJwtPayload(token);
    if (!payload || payload.type !== "admin") {
      const res = NextResponse.redirect(new URL("/admin/login", request.url));
      res.cookies.delete("pannuy_admin_session");
      return res;
    }
    return NextResponse.next();
  }

  if (SUPPLIER_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const supplierToken = request.cookies.get("pannuy_supplier_session")?.value;
    const customerToken = request.cookies.get("pannuy_session")?.value;

    // If the user has a customer session but no valid supplier session,
    // they landed here by accident (e.g. stale cookie). Redirect to customer area.
    const supplierPayload = supplierToken ? decodeJwtPayload(supplierToken) : null;
    if ((!supplierToken || !supplierPayload || supplierPayload.type !== "supplier") && customerToken) {
      const customerPayload = decodeJwtPayload(customerToken);
      if (customerPayload && customerPayload.type === "customer") {
        const res = NextResponse.redirect(new URL("/dashboard/meetings", request.url));
        res.cookies.delete("pannuy_supplier_session");
        return res;
      }
    }

    if (!supplierToken) return NextResponse.redirect(new URL("/supplier/login", request.url));
    if (!supplierPayload || supplierPayload.type !== "supplier") {
      const res = NextResponse.redirect(new URL("/supplier/login", request.url));
      res.cookies.delete("pannuy_supplier_session");
      return res;
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
