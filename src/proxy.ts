import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// ─── Route matchers ───────────────────────────────────────────────────────────

const CUSTOMER_PROTECTED_PREFIXES = ["/dashboard"];

const SUPPLIER_PROTECTED_PREFIXES = [
  "/supplier/dashboard",
  "/supplier/bookings",
  "/supplier/profile",
  "/supplier/calendar",
  "/supplier/packages",
];

function isCustomerProtected(pathname: string): boolean {
  return CUSTOMER_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

function isSupplierProtected(pathname: string): boolean {
  return SUPPLIER_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

// ─── Proxy (Next.js 16 middleware replacement) ────────────────────────────────

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Customer routes ──────────────────────────────────────────────────────
  if (isCustomerProtected(pathname)) {
    const token = request.cookies.get("pannuy_session")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/start", request.url));
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded as { type: string }).type !== "customer") {
      const response = NextResponse.redirect(new URL("/start", request.url));
      response.cookies.delete("pannuy_session");
      return response;
    }

    return NextResponse.next();
  }

  // ── Supplier routes ──────────────────────────────────────────────────────
  if (isSupplierProtected(pathname)) {
    const token = request.cookies.get("pannuy_supplier_session")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/supplier/login", request.url));
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded as { type: string }).type !== "supplier") {
      const response = NextResponse.redirect(
        new URL("/supplier/login", request.url)
      );
      response.cookies.delete("pannuy_supplier_session");
      return response;
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     * - API routes (those handle their own auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
