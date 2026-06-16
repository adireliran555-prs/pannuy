import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOtp, hashOtp } from "@/lib/auth";
import { sendOtp } from "@/lib/sms";

const OTP_EXPIRES_MINUTES = parseInt(
  process.env.OTP_EXPIRES_MINUTES ?? "5",
  10
);
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
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

    // Invalidate prior live codes so only the newest is valid (per-phone lockout).
    await prisma.otp.updateMany({
      where: { phone, used: false },
      data: { used: true },
    });

    await Promise.all([
      prisma.otp.create({ data: { phone, hash, expiresAt } }),
      sendOtp(phone, otp),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/supplier/auth/send-otp]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
