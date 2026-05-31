import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  return NextResponse.json({ success: true, admin: { phone: session.phone } });
}
