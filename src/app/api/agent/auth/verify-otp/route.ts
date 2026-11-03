import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyOtp, signAgentToken } from "@/lib/auth";
import { normalizeIsraeliPhone } from "@/lib/utils";
import { AgentSession } from "@/types";
import { AGENT_TERMS_VERSION } from "@/lib/legal";
import { checkOtpIpLimit, clientIp } from "@/lib/otp-ip-limit";
import { generateAgentCode } from "@/lib/agents";
import { z } from "zod";

const verifySchema = z.object({
  phone: z.string().min(9).max(20),
  otp: z.string().regex(/^\d{6}$/),
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().email().max(200).optional(),
  agreementAccepted: z.boolean().optional(),
});

const SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
const MAX_OTP_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const parsed = verifySchema.safeParse(await request.json().catch(() => null));
    const phone = parsed.success ? normalizeIsraeliPhone(parsed.data.phone) : null;
    if (!parsed.success || !phone) {
      return NextResponse.json({ success: false, error: "טלפון וקוד חובה" }, { status: 400 });
    }
    const { otp, name, email, agreementAccepted } = parsed.data;

    if (!(await checkOtpIpLimit(clientIp(request), 30, "verify"))) {
      return NextResponse.json(
        { success: false, error: "יותר מדי ניסיונות. נסו שוב מאוחר יותר" },
        { status: 429 }
      );
    }

    const existingAgent = await prisma.agent.findUnique({ where: { phone }, select: { id: true } });
    if (!existingAgent && !name) {
      return NextResponse.json(
        { success: false, error: "לא נמצא סוכן עם מספר זה. הצטרפו קודם" },
        { status: 404 }
      );
    }
    if (!existingAgent && !agreementAccepted) {
      return NextResponse.json(
        { success: false, error: "יש לאשר את תנאי תוכנית הסוכנים" },
        { status: 400 }
      );
    }

    const skipOtpCheck =
      process.env.NODE_ENV !== "production" && process.env.ALLOW_OTP_BYPASS === "true";

    const upsertAgent = async () => {
      const existing = await prisma.agent.findUnique({ where: { phone } });
      if (existing) return existing;
      return prisma.agent.create({
        data: {
          phone,
          name: name ?? "סוכן חדש",
          ...(email ? { email } : {}),
          referralCode: await generateAgentCode(),
          agreementVersion: AGENT_TERMS_VERSION,
          agreementAcceptedAt: new Date(),
        },
      });
    };

    let agent;
    if (skipOtpCheck) {
      agent = await upsertAgent();
    } else {
      const otpRecord = await prisma.otp.findFirst({
        where: { phone, used: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      });
      if (!otpRecord) {
        return NextResponse.json({ success: false, error: "קוד שגוי או פג תוקף" }, { status: 401 });
      }
      if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
        await prisma.otp.update({ where: { id: otpRecord.id }, data: { used: true } });
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
          await prisma.otp.update({ where: { id: otpRecord.id }, data: { used: true } });
          return NextResponse.json(
            { success: false, error: "יותר מדי ניסיונות, בקשו קוד חדש" },
            { status: 429 }
          );
        }
        return NextResponse.json({ success: false, error: "קוד שגוי או פג תוקף" }, { status: 401 });
      }
      const claimed = await prisma.otp.updateMany({
        where: { id: otpRecord.id, used: false },
        data: { used: true },
      });
      if (claimed.count !== 1) {
        return NextResponse.json({ success: false, error: "קוד שגוי או פג תוקף" }, { status: 401 });
      }
      agent = await upsertAgent();
    }

    if (!agent.isActive) {
      return NextResponse.json(
        { success: false, error: "חשבון הסוכן אינו פעיל. פנו אלינו" },
        { status: 403 }
      );
    }

    const payload: AgentSession = {
      id: agent.id,
      name: agent.name,
      phone: agent.phone,
      referralCode: agent.referralCode,
    };
    const response = NextResponse.json({ success: true, agent: payload });
    response.cookies.set("pannuy_agent_session", signAgentToken(payload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_COOKIE_MAX_AGE,
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("[POST /api/agent/auth/verify-otp]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
