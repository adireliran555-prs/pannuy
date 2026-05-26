import { NextRequest, NextResponse } from "next/server";

const CUSTOMER_PROTECTED_PREFIXES = ["/dashboard"];
const SUPPLIER_PROTECTED_PREFIXES = [
  "/supplier/dashboard",
  "/supplier/bookings",
  "/supplier/profile",
  "/supplier/calendar",
  "/supplier/packages",
];

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

  if (SUPPLIER_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const token = request.cookies.get("pannuy_supplier_session")?.value;
    if (!token) return NextResponse.redirect(new URL("/supplier/login", request.url));
    const payload = decodeJwtPayload(token);
    if (!payload || payload.type !== "supplier") {
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
