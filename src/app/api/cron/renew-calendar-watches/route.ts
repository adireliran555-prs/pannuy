import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  registerCalendarWatch,
  stopCalendarWatch,
} from "@/lib/google-calendar";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Google Calendar push-notification watches expire (~1 week). Renew any that
// will lapse within this window so calendar→site sync never silently stops.
const RENEW_WITHIN_H = 48;

/**
 * Keeps the two-way calendar sync alive. Intended to run on a daily Vercel cron.
 * Finds connected suppliers whose watch is missing or about to expire, stops the
 * stale channel, and registers a fresh one. Best-effort per supplier — one
 * failure never aborts the batch.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const renewBefore = new Date(Date.now() + RENEW_WITHIN_H * 60 * 60 * 1000);
  let renewed = 0;
  let failed = 0;

  try {
    const suppliers = await prisma.supplier.findMany({
      where: {
        googleRefreshToken: { not: null },
        OR: [
          { googleChannelExpiry: null }, // connected but no active watch
          { googleChannelExpiry: { lte: renewBefore } }, // expiring soon
        ],
      },
      take: 500,
      select: { id: true },
    });

    for (const s of suppliers) {
      try {
        // Stop the stale channel first so we don't accumulate duplicate watches
        // (registerCalendarWatch overwrites the stored channel id).
        await stopCalendarWatch(s.id);
        const { channelId } = await registerCalendarWatch(s.id);
        if (channelId) renewed++;
        else failed++;
      } catch (perSupplierErr) {
        console.error(
          "[cron/renew-calendar-watches] supplier",
          s.id,
          perSupplierErr
        );
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      considered: suppliers.length,
      renewed,
      failed,
    });
  } catch (err) {
    console.error("[cron/renew-calendar-watches]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
