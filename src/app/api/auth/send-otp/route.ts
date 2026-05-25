import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCache, setCache } from "@/lib/redis";
import { generateOtp, hashOtp } from "@/lib/auth";
import { sendOtp } from "@/lib/sms";

const OTP_EXPIRES_MINUTES = parseInt(
  process.env.OTP_EXPIRES_MINUTES ?? "5",
  10
);
const RATE_LIMIT_WINDOW_SECONDS = 10 * 60; // 10 minutes
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

    // Rate limiting: max 3 OTPs per phone per 10 min
    const rateLimitKey = `otp_rate:${phone}`;
    const currentCount = await getCache<number>(rateLimitKey);
    if (currentCount !== null && currentCount >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        {
          success: false,
          error: "יותר מדי ניסיונות. נסה שוב מאוחר יותר",
        },
        { status: 429 }
      );
    }

    // Increment rate limit counter (preserve remaining TTL by setting full window on first hit)
    const newCount = (currentCount ?? 0) + 1;
    await setCache(rateLimitKey, newCount, RATE_LIMIT_WINDOW_SECONDS);

    // Generate and store OTP
    const otp = generateOtp();
    const hash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    await prisma.otp.create({
      data: { phone, hash, expiresAt },
    });

    await sendOtp(phone, otp);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/auth/send-otp]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
