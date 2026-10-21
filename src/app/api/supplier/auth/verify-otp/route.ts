import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import prisma from "@/lib/prisma";
import { verifyOtp, signSupplierToken } from "@/lib/auth";
import { normalizeIsraeliPhone } from "@/lib/utils";
import { SupplierSession } from "@/types";
import { SUPPLIER_AGREEMENT_VERSION } from "@/lib/legal";
import { checkOtpIpLimit, clientIp } from "@/lib/otp-ip-limit";
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

function generateSlug(name: string, phone: string): string {
  const base = slugify(name, { lower: true, strict: true, locale: "he" });
  const suffix = phone.slice(-4);
  return `${base || "supplier"}-${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = verifySchema.safeParse(await request.json().catch(() => null));
    const phone = parsed.success ? normalizeIsraeliPhone(parsed.data.phone) : null;
    if (!parsed.success || !phone) {
      return NextResponse.json(
        { success: false, error: "טלפון וקוד חובה" },
        { status: 400 }
      );
    }
    const { otp, name, email, agreementAccepted } = parsed.data;

    if (!(await checkOtpIpLimit(clientIp(request), 30, "verify"))) {
      return NextResponse.json(
        { success: false, error: "יותר מדי ניסיונות. נסו שוב מאוחר יותר" },
        { status: 429 }
      );
    }


    const existingSupplierCheck = await prisma.supplier.findUnique({
      where: { phone },
      select: { id: true },
    });
    if (!existingSupplierCheck && !agreementAccepted) {
      return NextResponse.json(
        { success: false, error: "יש לאשר את הסכם ההתקשרות עם ספקים" },
        { status: 400 }
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() ?? null;

    const skipOtpCheck =
      process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_OTP_BYPASS === "true";

    const upsertSupplier = () =>
      prisma.$transaction(async (tx) => {
        const existing = await tx.supplier.findUnique({ where: { phone } });

        if (existing) {
          // `name`/`email` are accepted only on account creation — a login must
          // never rename an existing supplier.
          return existing;
        }

        const supplierName = name ?? "ספק חדש";
        let slug = generateSlug(supplierName, phone);

        const slugExists = await tx.supplier.findUnique({ where: { slug } });
        if (slugExists) {
          slug = `${slug}-${Date.now().toString(36)}`;
        }

        return tx.supplier.create({
          data: {
            phone,
            name: supplierName,
            slug,
            ...(email ? { email } : {}),
            agreementVersion: SUPPLIER_AGREEMENT_VERSION,
            agreementAcceptedAt: new Date(),
            agreementAcceptedIp: ip,
          },
        });
      });

    let supplier;
    if (skipOtpCheck) {
      supplier = await upsertSupplier();
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
      supplier = await upsertSupplier();
    }

    const payload: SupplierSession = {
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone,
      category: supplier.category,
      slug: supplier.slug,
    };

    const token = signSupplierToken(payload);

    const response = NextResponse.json({ success: true, supplier: payload });
    response.cookies.set("pannuy_supplier_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_COOKIE_MAX_AGE,
      path: "/",
    });
    response.cookies.delete("pannuy_session");
    return response;
  } catch (err) {
    console.error("[POST /api/supplier/auth/verify-otp]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
