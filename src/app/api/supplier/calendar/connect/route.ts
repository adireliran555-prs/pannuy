import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireSupplierSession } from "@/lib/api-auth";
import { getAuthUrl } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    // CSRF/account-takeover protection: the OAuth `state` is a random nonce
    // (NOT the supplier id). We stash it in an httpOnly cookie and verify it
    // matches on callback. The tokens are written onto the *session* supplier,
    // never onto an id smuggled through `state`.
    const nonce = randomUUID();
    const authUrl = getAuthUrl(nonce);

    const res = NextResponse.json({ success: true, data: { authUrl } });
    res.cookies.set("pannuy_oauth_nonce", nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10, // 10 minutes
    });
    return res;
  } catch (err) {
    console.error("[GET /api/supplier/calendar/connect]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
