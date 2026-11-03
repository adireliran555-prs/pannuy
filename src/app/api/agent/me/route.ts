import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAgentSession } from "@/lib/api-auth";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireAgentSession(request);
    if (error) return error;

    const [agent, customers, suppliers, sums, recent] = await Promise.all([
      prisma.agent.findUnique({
        where: { id: session.id },
        select: { id: true, name: true, phone: true, email: true, referralCode: true, isActive: true, createdAt: true },
      }),
      prisma.user.count({ where: { referredByAgentId: session.id } }),
      prisma.supplier.count({ where: { referredByAgentId: session.id } }),
      prisma.agentEarning.groupBy({
        by: ["status"],
        where: { agentId: session.id },
        _sum: { amountIls: true },
        _count: { _all: true },
      }),
      prisma.agentEarning.findMany({
        where: { agentId: session.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          amountIls: true,
          status: true,
          createdAt: true,
          meeting: {
            select: {
              requestedDate: true,
              dealAmountIls: true,
              supplier: { select: { name: true, category: true } },
            },
          },
        },
      }),
    ]);

    if (!agent) {
      return NextResponse.json({ success: false, error: "סוכן לא נמצא" }, { status: 404 });
    }

    const earnings = { pending: 0, confirmed: 0, paid: 0, count: 0 };
    for (const row of sums) {
      const v = row._sum.amountIls ?? 0;
      if (row.status === "PENDING") earnings.pending += v;
      else if (row.status === "CONFIRMED") earnings.confirmed += v;
      else if (row.status === "PAID") earnings.paid += v;
      if (row.status !== "CANCELLED") earnings.count += row._count._all;
    }

    return NextResponse.json({
      success: true,
      data: {
        agent,
        stats: { referredCustomers: customers, referredSuppliers: suppliers, earnings },
        recent: recent.map((e) => ({
          id: e.id,
          amountIls: e.amountIls,
          status: e.status,
          createdAt: e.createdAt,
          eventDate: e.meeting.requestedDate,
          dealAmountIls: e.meeting.dealAmountIls,
          supplierName: e.meeting.supplier.name,
          supplierCategory: e.meeting.supplier.category,
        })),
      },
    });
  } catch (err) {
    console.error("[GET /api/agent/me]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}

const patchSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().email().max(200).or(z.literal("")).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const { session, error } = requireAgentSession(request);
    if (error) return error;
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "נתונים לא תקינים" }, { status: 400 });
    }
    const { name, email } = parsed.data;
    const agent = await prisma.agent.update({
      where: { id: session.id },
      data: {
        ...(name ? { name } : {}),
        ...(email !== undefined ? { email: email || null } : {}),
      },
      select: { id: true, name: true, phone: true, email: true, referralCode: true },
    });
    return NextResponse.json({ success: true, data: agent });
  } catch (err) {
    console.error("[PATCH /api/agent/me]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
