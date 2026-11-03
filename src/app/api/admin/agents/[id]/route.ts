import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/api-auth";
import { z } from "zod";

const schema = z.object({
  isActive: z.boolean().optional(),
  markPaid: z.boolean().optional(), // CONFIRMED earnings → PAID
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAdminSession(request);
  if (error) return error;
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "נתונים לא תקינים" }, { status: 400 });
  }
  try {
    const { isActive, markPaid } = parsed.data;
    if (isActive !== undefined) {
      await prisma.agent.update({ where: { id }, data: { isActive } });
    }
    let paidCount = 0;
    if (markPaid) {
      const r = await prisma.agentEarning.updateMany({
        where: { agentId: id, status: "CONFIRMED" },
        data: { status: "PAID", paidAt: new Date() },
      });
      paidCount = r.count;
    }
    return NextResponse.json({ success: true, data: { paidCount } });
  } catch (err) {
    console.error("[PATCH /api/admin/agents/[id]]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
