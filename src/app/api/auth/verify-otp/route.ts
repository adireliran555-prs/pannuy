import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyOtp, signCustomerToken } from "@/lib/auth";
import { CustomerSession } from "@/types";

const SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      phone,
      otp,
      name,
      weddingDate,
      weddingArea,
    } = body as {
      phone?: string;
      otp?: string;
      name?: string;
      weddingDate?: string;
      weddingArea?: string;
    };

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: "טלפון וקוד חובה" },
        { status: 400 }
      );
    }

    const skipOtpCheck =
      process.env.NODE_ENV !== "production" || process.env.BYPASS_OTP === "true";

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

    const user = await prisma.user.upsert({
      where: { phone },
      create: {
        phone,
        name: name ?? "משתמש חדש",
        weddingDate: weddingDate ? new Date(weddingDate) : undefined,
        weddingArea: weddingArea ?? undefined,
      },
      update: {
        ...(name ? { name } : {}),
        ...(weddingDate ? { weddingDate: new Date(weddingDate) } : {}),
        ...(weddingArea ? { weddingArea } : {}),
      },
    });

    const payload: CustomerSession = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      weddingDate: user.weddingDate?.toISOString() ?? null,
      weddingArea: user.weddingArea ?? null,
    };

    const token = signCustomerToken(payload);

    // Persist session token to DB
    await prisma.user.update({
      where: { id: user.id },
      data: { sessionToken: token },
    });

    const response = NextResponse.json({ success: true, user: payload });
    response.cookies.set("pannuy_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_COOKIE_MAX_AGE,
      path: "/",
    });
    response.cookies.delete("pannuy_supplier_session");

    return response;
  } catch (err) {
    console.error("[POST /api/auth/verify-otp]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
