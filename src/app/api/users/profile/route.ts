import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCustomerSession, getCustomerSession } from "@/lib/api-auth";
import { signCustomerToken } from "@/lib/auth";
import { CustomerSession } from "@/types";

const SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, name: true, phone: true, weddingDate: true, weddingArea: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("[GET /api/users/profile]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const body = await request.json();
    const { name, weddingDate, weddingArea, email } = body as {
      name?: string;
      weddingDate?: string;
      email?: string;
      weddingArea?: string;
    };

    const updated = await prisma.user.update({
      where: { id: session.id },
      data: {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
        ...(weddingDate ? { weddingDate: new Date(weddingDate) } : {}),
        ...(weddingArea ? { weddingArea } : {}),
      },
    });

    const payload: CustomerSession = {
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      weddingDate: updated.weddingDate?.toISOString() ?? null,
      weddingArea: updated.weddingArea ?? null,
    };

    const token = signCustomerToken(payload);
    await prisma.user.update({ where: { id: updated.id }, data: { sessionToken: token } });

    const response = NextResponse.json({ success: true, user: payload });
    response.cookies.set("pannuy_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[PATCH /api/users/profile]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
