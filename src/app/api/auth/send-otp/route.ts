import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOtp, hashOtp } from "@/lib/auth";
import { sendOtp, devOtpEchoEnabled } from "@/lib/sms";

const OTP_EXPIRES_MINUTES = parseInt(
  process.env.OTP_EXPIRES_MINUTES ?? "5",
  10
);
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 3;

function isValidIsraeliPhone(phone: string): boolean {
  return /^05\d{8}$/.test(phone);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body as { phone?: string };

    if (!phone || !isValidIsraeliPhone(phone)) {
      return NextResponse.json(
        { success: false, error: "מספר טלפון לא תקין" },
        { status: 400 }
      );
    }

    // Rate limit: count OTPs already issued to this phone within the window.
    // The Otp table is the source of truth (Redis cache is best-effort and
    // currently no-op when Upstash env vars aren't set).
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recent = await prisma.otp.count({
      where: { phone, createdAt: { gte: since } },
    });
    if (recent >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { success: false, error: "יותר מדי ניסיונות. נסה שוב מאוחר יותר" },
        { status: 429 }
      );
    }

    const otp = generateOtp();
    const hash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    // Invalidate any prior live codes so only the newest is valid — this makes
    // the per-code verify-attempt lockout effectively per-phone.
    await prisma.otp.updateMany({
      where: { phone, used: false },
      data: { used: true },
    });

    await Promise.all([
      prisma.otp.create({ data: { phone, hash, expiresAt } }),
      sendOtp(phone, otp),
    ]);

    return NextResponse.json({
      success: true,
      ...(devOtpEchoEnabled() ? { devOtp: otp } : {}),
    });
  } catch (err) {
    console.error("[POST /api/auth/send-otp]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
