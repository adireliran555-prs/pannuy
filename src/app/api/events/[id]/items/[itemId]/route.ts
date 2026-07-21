import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/api-auth";
import { getEventPayload } from "@/lib/event-service";
import { commitPriceForPackage } from "@/lib/event-planning";
import type { PlanItemStatus, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_STATUSES: PlanItemStatus[] = [
  "PENDING",
  "BROWSING",
  "SELECTED",
  "SKIPPED",
  "NOT_NEEDED",
];

// PATCH /api/events/[id]/items/[itemId]
// Body: { status?, selectedSupplierId?, selectedPackageId?, notes? }
// Selecting a supplier+package locks its price into committedPrice; any other
// status clears the selection so the budget rolls back automatically.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const { id: eventId, itemId } = await params;

    const item = await prisma.eventPlanItem.findFirst({
      where: { id: itemId, eventId, event: { userId: session.id } },
      select: { id: true, category: true, status: true },
    });
    if (!item) {
      return NextResponse.json(
        { success: false, error: "פריט לא נמצא" },
        { status: 404 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      status?: string;
      selectedSupplierId?: string;
      selectedPackageId?: string;
      notes?: string | null;
    };

    const data: Prisma.EventPlanItemUpdateInput = {};

    if (typeof body.notes === "string" || body.notes === null) {
      data.notes = body.notes;
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status as PlanItemStatus)) {
        return NextResponse.json(
          { success: false, error: "סטטוס לא תקין" },
          { status: 400 }
        );
      }
      const status = body.status as PlanItemStatus;

      if (status === "SELECTED") {
        if (!body.selectedSupplierId || !body.selectedPackageId) {
          return NextResponse.json(
            { success: false, error: "יש לבחור ספק וחבילה" },
            { status: 400 }
          );
        }

        // The chosen package must belong to the chosen supplier, which must
        // match this plan item's category and be active.
        const pkg = await prisma.supplierPackage.findFirst({
          where: {
            id: body.selectedPackageId,
            supplierId: body.selectedSupplierId,
            supplier: { isActive: true, category: item.category },
          },
          select: { id: true, price: true },
        });
        if (!pkg) {
          return NextResponse.json(
            { success: false, error: "החבילה או הספק אינם זמינים לקטגוריה זו" },
            { status: 400 }
          );
        }

        data.status = "SELECTED";
        data.selectedSupplier = { connect: { id: body.selectedSupplierId } };
        data.selectedPackageId = pkg.id;
        data.committedPrice = commitPriceForPackage(pkg.price);
      } else {
        // Moving away from a selection: roll back the commitment.
        data.status = status;
        data.selectedSupplier = { disconnect: true };
        data.selectedPackageId = null;
        data.committedPrice = null;
      }
    }

    await prisma.eventPlanItem.update({ where: { id: itemId }, data });

    const payload = await getEventPayload(eventId, session.id);
    return NextResponse.json({ success: true, data: payload });
  } catch (err) {
    console.error("[PATCH /api/events/[id]/items/[itemId]]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
