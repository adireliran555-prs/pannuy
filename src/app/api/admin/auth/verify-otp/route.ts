import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyOtp, signAdminToken, isAdminPhone } from "@/lib/auth";
import { checkOtpIpLimit, clientIp } from "@/lib/otp-ip-limit";
import { z } from "zod";

const verifySchema = z.object({
  phone: z.string().regex(/^05\d{8}$/),
  otp: z.string().regex(/^\d{6}$/),
});

const SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
const MAX_OTP_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const parsed = verifySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "טלפון וקוד חובה" }, { status: 400 });
    }
    const { phone, otp } = parsed.data;
    if (!(await checkOtpIpLimit(clientIp(request), 30, "verify"))) {
      return NextResponse.json(
        { success: false, error: "יותר מדי ניסיונות. נסו שוב מאוחר יותר" },
        { status: 429 }
      );
    }

    if (!isAdminPhone(phone)) {
      return NextResponse.json({ success: false, error: "אין הרשאה" }, { status: 403 });
    }

    const otpRecord = await prisma.otp.findFirst({
      where: { phone, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: "קוד שגוי או פג תוקף" },
        { status: 401 }
      );
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await prisma.otp.update({
        where: { id: otpRecord.id },
        data: { used: true },
      });
      return NextResponse.json(
        { success: false, error: "יותר מדי ניסיונות, בקשו קוד חדש" },
        { status: 429 }
      );
    }

    if (!(await verifyOtp(otp, otpRecord.hash))) {
      const updated = await prisma.otp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      if (updated.attempts >= MAX_OTP_ATTEMPTS) {
        await prisma.otp.update({
          where: { id: otpRecord.id },
          data: { used: true },
        });
        return NextResponse.json(
          { success: false, error: "יותר מדי ניסיונות, בקשו קוד חדש" },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { success: false, error: "קוד שגוי או פג תוקף" },
        { status: 401 }
      );
    }

    // Atomically claim the code so two concurrent verifies can't both win.
    const claimed = await prisma.otp.updateMany({
      where: { id: otpRecord.id, used: false },
      data: { used: true },
    });
    if (claimed.count !== 1) {
      return NextResponse.json(
        { success: false, error: "קוד שגוי או פג תוקף" },
        { status: 401 }
      );
    }

    const token = signAdminToken({ phone });

    const response = NextResponse.json({ success: true });
    response.cookies.set("pannuy_admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_COOKIE_MAX_AGE,
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("[POST /api/admin/auth/verify-otp]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
