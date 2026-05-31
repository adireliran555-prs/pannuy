import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyOtp, signAdminToken, isAdminPhone } from "@/lib/auth";

const SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp } = body as { phone?: string; otp?: string };

    if (!phone || !otp) {
      return NextResponse.json({ success: false, error: "טלפון וקוד חובה" }, { status: 400 });
    }
    if (!isAdminPhone(phone)) {
      return NextResponse.json({ success: false, error: "אין הרשאה" }, { status: 403 });
    }

    const skipOtpCheck = process.env.NODE_ENV !== "production" || process.env.BYPASS_OTP === "true";

    if (!skipOtpCheck) {
      const otpRecord = await prisma.otp.findFirst({
        where: { phone, used: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      });

      if (!otpRecord || !(await verifyOtp(otp, otpRecord.hash))) {
        return NextResponse.json(
          { success: false, error: "קוד שגוי או פג תוקף" },
          { status: 401 }
        );
      }

      await prisma.otp.update({ where: { id: otpRecord.id }, data: { used: true } });
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
