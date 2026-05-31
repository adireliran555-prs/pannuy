import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const { error } = requireAdminSession(request);
  if (error) return error;

  const res = NextResponse.json({ success: true, redirect: "/admin" });
  res.cookies.delete("pannuy_session");
  res.cookies.delete("pannuy_supplier_session");
  return res;
}
