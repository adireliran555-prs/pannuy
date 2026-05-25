import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerSession } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const session = getCustomerSession(request);

    if (session) {
      // Clear session token in DB
      await prisma.user.update({
        where: { id: session.id },
        data: { sessionToken: null },
      }).catch(() => {
        // User might not exist — swallow
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete("pannuy_session");
    return response;
  } catch (err) {
    console.error("[POST /api/auth/logout]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
