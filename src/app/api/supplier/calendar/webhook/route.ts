import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { syncSupplierBusyDays } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

// Google Calendar push notifications. No session cookie — Google calls this.
// Always respond 200 quickly and never throw; calendar sync is best-effort.
export async function POST(request: NextRequest) {
  try {
    const resourceState = request.headers.get("x-goog-resource-state");

    // Initial handshake when the watch channel is created.
    if (resourceState === "sync") {
      return new Response(null, { status: 200 });
    }

    const channelId = request.headers.get("x-goog-channel-id");
    if (channelId) {
      const supplier = await prisma.supplier.findFirst({
        where: { googleChannelId: channelId },
        select: { id: true },
      });

      if (supplier) {
        await syncSupplierBusyDays(supplier.id);
      }
    }
  } catch (err) {
    console.error("[POST /api/supplier/calendar/webhook]", err);
  }

  return new Response(null, { status: 200 });
}
