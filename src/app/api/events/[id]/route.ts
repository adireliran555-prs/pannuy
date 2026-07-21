import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/api-auth";
import { getEventPayload, reallocateBudget } from "@/lib/event-service";
import { isValidEventTypeId } from "@/lib/event-types";
import { normalizeVibes } from "@/lib/event-planning";
import { REGION_IDS } from "@/lib/regions";
import type { BudgetMode, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/events/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const { id } = await params;
    const payload = await getEventPayload(id, session.id);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "אירוע לא נמצא" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: payload });
  } catch (err) {
    console.error("[GET /api/events/[id]]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}

// PATCH /api/events/[id] — edit event details; re-allocates budget when the
// budget/guest inputs change.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const { id } = await params;

    const owned = await prisma.event.findFirst({
      where: { id, userId: session.id },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json(
        { success: false, error: "אירוע לא נמצא" },
        { status: 404 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const data: Prisma.EventUpdateInput = {};
    let budgetChanged = false;

    if (typeof body.type === "string" && isValidEventTypeId(body.type)) {
      data.type = body.type;
    }
    if ("date" in body) {
      const d = body.date;
      if (d === null) data.date = null;
      else if (typeof d === "string" && d) {
        const parsed = new Date(d);
        if (!Number.isNaN(parsed.getTime())) data.date = parsed;
      }
    }
    if ("dateFlexible" in body) data.dateFlexible = Boolean(body.dateFlexible);
    if (Array.isArray(body.areas)) {
      data.areas = [
        ...new Set(
          (body.areas as unknown[]).filter(
            (a): a is string => typeof a === "string" && (REGION_IDS as readonly string[]).includes(a)
          )
        ),
      ];
    }
    if ("city" in body) {
      data.city = typeof body.city === "string" && body.city.trim() ? body.city.trim() : null;
    }
    if ("guestCount" in body) {
      const g = body.guestCount;
      data.guestCount =
        g === null || g === undefined
          ? null
          : Number.isFinite(Number(g)) && Number(g) > 0
            ? Math.min(5000, Math.round(Number(g)))
            : null;
      budgetChanged = true;
    }
    if (body.budgetMode === "TOTAL" || body.budgetMode === "PER_GUEST") {
      data.budgetMode = body.budgetMode as BudgetMode;
      budgetChanged = true;
    }
    if ("budgetAmount" in body) {
      const a = body.budgetAmount;
      data.budgetAmount =
        a === null || a === undefined
          ? null
          : Number.isFinite(Number(a)) && Number(a) > 0
            ? Math.round(Number(a))
            : null;
      budgetChanged = true;
    }
    if (Array.isArray(body.vibeTags)) {
      data.vibeTags = normalizeVibes(body.vibeTags as string[]);
    }
    if ("kosher" in body) data.kosher = Boolean(body.kosher);
    if (body.status === "ACTIVE" || body.status === "ARCHIVED" || body.status === "COMPLETED") {
      data.status = body.status;
    }

    await prisma.event.update({ where: { id }, data });
    if (budgetChanged) await reallocateBudget(id);

    const payload = await getEventPayload(id, session.id);
    return NextResponse.json({ success: true, data: payload });
  } catch (err) {
    console.error("[PATCH /api/events/[id]]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] — archive (soft) the plan.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const { id } = await params;
    const owned = await prisma.event.findFirst({
      where: { id, userId: session.id },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json(
        { success: false, error: "אירוע לא נמצא" },
        { status: 404 }
      );
    }

    await prisma.event.update({ where: { id }, data: { status: "ARCHIVED" } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/events/[id]]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
