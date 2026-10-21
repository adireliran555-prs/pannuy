import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyOtp, signCustomerToken } from "@/lib/auth";
import { CustomerSession } from "@/types";
import { checkOtpIpLimit, clientIp } from "@/lib/otp-ip-limit";
import { z } from "zod";

const verifySchema = z.object({
  phone: z.string().regex(/^05\d{8}$/),
  otp: z.string().regex(/^\d{6}$/),
  name: z.string().trim().min(1).max(100).optional(),
  weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  weddingArea: z.string().max(200).optional(),
});

const SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
const MAX_OTP_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const parsed = verifySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "טלפון וקוד חובה" },
        { status: 400 }
      );
    }
    const { phone, otp, name, weddingDate, weddingArea } = parsed.data;

    if (!(await checkOtpIpLimit(clientIp(request), 30, "verify"))) {
      return NextResponse.json(
        { success: false, error: "יותר מדי ניסיונות. נסו שוב מאוחר יותר" },
        { status: 429 }
      );
    }


    const skipOtpCheck =
      process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_OTP_BYPASS === "true";

    const upsertUser = () =>
      prisma.user.upsert({
        where: { phone },
        create: {
          phone,
          name: name ?? "משתמש חדש",
          weddingDate: weddingDate ? new Date(`${weddingDate}T00:00:00Z`) : undefined,
          weddingArea: weddingArea ?? undefined,
        },
        // `name` is accepted only on account creation — a login must never rename
        // an existing account (a phone-only OTP proves possession, not identity).
        update: {
          ...(weddingDate ? { weddingDate: new Date(`${weddingDate}T00:00:00Z`) } : {}),
          ...(weddingArea ? { weddingArea } : {}),
        },
      });

    let user;
    if (skipOtpCheck) {
      user = await upsertUser();
    } else {
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
      user = await upsertUser();
    }

    const payload: CustomerSession = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      weddingDate: user.weddingDate?.toISOString() ?? null,
      weddingArea: user.weddingArea ?? null,
    };

    const token = signCustomerToken(payload);

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
