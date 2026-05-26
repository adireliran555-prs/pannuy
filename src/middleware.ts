import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isCustomerProtected(pathname)) {
    const token = request.cookies.get("pannuy_session")?.value;
    if (!token) return NextResponse.redirect(new URL("/start", request.url));
    const decoded = verifyToken(token);
    if (!decoded || (decoded as { type: string }).type !== "customer") {
      const res = NextResponse.redirect(new URL("/start", request.url));
      res.cookies.delete("pannuy_session");
      return res;
    }
    return NextResponse.next();
  }

  if (isSupplierProtected(pathname)) {
    const token = request.cookies.get("pannuy_supplier_session")?.value;
    if (!token) return NextResponse.redirect(new URL("/supplier/login", request.url));
    const decoded = verifyToken(token);
    if (!decoded || (decoded as { type: string }).type !== "supplier") {
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
