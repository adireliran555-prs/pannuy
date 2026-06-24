import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import prisma from "@/lib/prisma";
import { verifyOtp, signSupplierToken } from "@/lib/auth";
import { normalizeIsraeliPhone } from "@/lib/utils";
import { SupplierSession } from "@/types";

const SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
const MAX_OTP_ATTEMPTS = 5;

function generateSlug(name: string, phone: string): string {
  const base = slugify(name, { lower: true, strict: true, locale: "he" });
  const suffix = phone.slice(-4);
  return `${base || "supplier"}-${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizeIsraeliPhone(String(body.phone ?? ""));
    const { otp, name, email } = body as {
      otp?: string;
      name?: string;
      email?: string;
    };

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: "טלפון וקוד חובה" },
        { status: 400 }
      );
    }

    const skipOtpCheck =
      process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_OTP_BYPASS === "true";

    const upsertSupplier = () =>
      prisma.$transaction(async (tx) => {
        const existing = await tx.supplier.findUnique({ where: { phone } });

        if (existing) {
          return tx.supplier.update({
            where: { phone },
            data: {
              ...(name ? { name } : {}),
              ...(email ? { email } : {}),
            },
          });
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

      [, supplier] = await Promise.all([
        prisma.otp.update({ where: { id: otpRecord.id }, data: { used: true } }),
        upsertSupplier(),
      ]);
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
