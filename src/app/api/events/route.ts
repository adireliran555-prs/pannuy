import { NextRequest, NextResponse } from "next/server";
import { requireCustomerSession } from "@/lib/api-auth";
import {
  createEventWithItems,
  getActiveEventPayload,
  getEventPayload,
} from "@/lib/event-service";
import { isValidEventTypeId } from "@/lib/event-types";
import { normalizeVibes } from "@/lib/event-planning";
import { REGION_IDS } from "@/lib/regions";
import type { BudgetMode } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/events — the current user's active plan (event + items + summary).
export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const payload = await getActiveEventPayload(session.id);
    return NextResponse.json({ success: true, data: payload });
  } catch (err) {
    console.error("[GET /api/events]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}

// POST /api/events — start a new guided plan.
export async function POST(request: NextRequest) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const {
      type,
      date,
      dateFlexible,
      areas,
      city,
      guestCount,
      budgetMode,
      budgetAmount,
      vibeTags,
      kosher,
    } = body as Record<string, unknown>;

    // ── Validation ──
    const eventType = typeof type === "string" && isValidEventTypeId(type) ? type : "wedding";

    const cleanAreas = Array.isArray(areas)
      ? [...new Set(areas.filter((a): a is string => typeof a === "string" && (REGION_IDS as readonly string[]).includes(a)))]
      : [];

    const guests =
      guestCount === null || guestCount === undefined
        ? null
        : Number.isFinite(Number(guestCount)) && Number(guestCount) > 0
          ? Math.min(5000, Math.round(Number(guestCount)))
          : null;

    const mode: BudgetMode = budgetMode === "PER_GUEST" ? "PER_GUEST" : "TOTAL";

    const amount =
      budgetAmount === null || budgetAmount === undefined
        ? null
        : Number.isFinite(Number(budgetAmount)) && Number(budgetAmount) > 0
          ? Math.round(Number(budgetAmount))
          : null;

    if (mode === "PER_GUEST" && amount !== null && guests === null) {
      return NextResponse.json(
        { success: false, error: "כדי לחשב תקציב לפי אורח צריך להזין מספר אורחים" },
        { status: 400 }
      );
    }

    const eventId = await createEventWithItems(session.id, {
      type: eventType,
      date: typeof date === "string" && date ? date : null,
      dateFlexible: Boolean(dateFlexible),
      areas: cleanAreas,
      city: typeof city === "string" && city.trim() ? city.trim() : null,
      guestCount: guests,
      budgetMode: mode,
      budgetAmount: amount,
      vibeTags: normalizeVibes(Array.isArray(vibeTags) ? (vibeTags as string[]) : []),
      kosher: Boolean(kosher),
    });

    const payload = await getEventPayload(eventId, session.id);
    return NextResponse.json({ success: true, data: payload }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/events]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
