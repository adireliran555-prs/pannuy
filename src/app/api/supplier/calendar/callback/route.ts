import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { exchangeCodeForTokens } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // supplierId

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/supplier/dashboard/calendar?error=missing_params", request.url)
      );
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: state },
      select: { id: true },
    });

    if (!supplier) {
      return NextResponse.redirect(
        new URL("/supplier/dashboard/calendar?error=invalid_state", request.url)
      );
    }

    const { accessToken, refreshToken, expiry } =
      await exchangeCodeForTokens(code);

    await prisma.supplier.update({
      where: { id: state },
      data: {
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken,
        googleTokenExpiry: expiry,
      },
    });

    return NextResponse.redirect(
      new URL("/supplier/dashboard/calendar?connected=true", request.url)
    );
  } catch (err) {
    console.error("[GET /api/supplier/calendar/callback]", err);
    return NextResponse.redirect(
      new URL("/supplier/dashboard/calendar?error=oauth_failed", request.url)
    );
  }
}
