import { NextRequest, NextResponse } from "next/server";

const CUSTOMER_PROTECTED_PREFIXES = ["/dashboard", "/search"];
const SUPPLIER_PROTECTED_PREFIXES = [
  "/supplier/dashboard",
  "/supplier/bookings",
  "/supplier/profile",
  "/supplier/calendar",
  "/supplier/packages",
  "/supplier/finances",
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
  const { pathname, searchParams } = request.nextUrl;

  // Affiliate referral tracking: ?ref=CODE sets a 30-day cookie
  const refCode = searchParams.get("ref");
  if (refCode && /^[A-Z0-9]{6,12}$/.test(refCode)) {
    const response = NextResponse.next();
    response.cookies.set("pannuy_ref", refCode, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  }

  if (CUSTOMER_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    // Preserve the original destination (e.g. /search?date=...) so the user
    // lands back on it after completing registration.
    const startUrl = new URL("/start", request.url);
    startUrl.searchParams.set("returnTo", `${pathname}${request.nextUrl.search}`);

    const token = request.cookies.get("pannuy_session")?.value;
    if (!token) return NextResponse.redirect(startUrl);
    const payload = decodeJwtPayload(token);
    if (!payload || payload.type !== "customer") {
      const res = NextResponse.redirect(startUrl);
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
