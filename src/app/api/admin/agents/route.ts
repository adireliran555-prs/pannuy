import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error } = requireAdminSession(request);
  if (error) return error;
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, phone: true, email: true, referralCode: true, isActive: true, createdAt: true,
        _count: { select: { referredCustomers: true, referredSuppliers: true } },
        earnings: { select: { amountIls: true, status: true } },
      },
    });
    const data = agents.map((a) => {
      const sum = (s: string) => a.earnings.filter((e) => e.status === s).reduce((t, e) => t + e.amountIls, 0);
      return {
        id: a.id, name: a.name, phone: a.phone, email: a.email, referralCode: a.referralCode,
        isActive: a.isActive, createdAt: a.createdAt,
        referredCustomers: a._count.referredCustomers, referredSuppliers: a._count.referredSuppliers,
        pending: sum("PENDING"), confirmed: sum("CONFIRMED"), paid: sum("PAID"),
      };
    });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[GET /api/admin/agents]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
