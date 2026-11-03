import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { logAdminAction } from "@/lib/activity-admin";

export async function POST(request: NextRequest) {
  const { error } = requireAdminSession(request);
  if (error) return error;

  logAdminAction(request, { route: "/api/admin/stop-impersonate" });
  const res = NextResponse.json({ success: true, redirect: "/admin" });
  res.cookies.delete("pannuy_session");
  res.cookies.delete("pannuy_supplier_session");
  return res;
}
