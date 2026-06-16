import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import {
  exchangeCodeForTokens,
  ensurePannuyCalendar,
  syncSupplierBusyDays,
} from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    // The supplier must be authenticated when Google redirects back. Tokens are
    // bound to THIS session's supplier id, never to anything carried in `state`.
    const { session, error } = requireSupplierSession(request);
    if (error) {
      return NextResponse.redirect(
        new URL("/supplier/calendar?error=unauthorized", request.url)
      );
    }

    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/supplier/calendar?error=missing_params", request.url)
      );
    }

    // CSRF check: `state` must match the random nonce we set on connect.
    const nonce = request.cookies.get("pannuy_oauth_nonce")?.value;
    if (!nonce || state !== nonce) {
      return NextResponse.redirect(
        new URL("/supplier/calendar?error=invalid_state", request.url)
      );
    }

    const { accessToken, refreshToken, expiry } =
      await exchangeCodeForTokens(code);

    await prisma.supplier.update({
      where: { id: session.id },
      data: {
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken,
        googleTokenExpiry: expiry,
      },
    });

    // Provision the dedicated "פנוי — זמינות" calendar and pull anything already
    // on it. Both are non-fatal — connection still succeeds if they fail.
    await ensurePannuyCalendar(session.id);
    await syncSupplierBusyDays(session.id).catch(() => {});

    const res = NextResponse.redirect(
      new URL("/supplier/calendar?connected=true", request.url)
    );
    res.cookies.delete("pannuy_oauth_nonce");
    return res;
  } catch (err) {
    console.error("[GET /api/supplier/calendar/callback]", err);
    return NextResponse.redirect(
      new URL("/supplier/calendar?error=oauth_failed", request.url)
    );
  }
}
