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
    const channelToken = request.headers.get("x-goog-channel-token");
    if (channelId && channelToken) {
      const supplier = await prisma.supplier.findFirst({
        where: { googleChannelId: channelId },
        select: { id: true, googleChannelToken: true },
      });

      // Authenticate the notification: the token Google echoes back must match
      // the secret we set when registering the watch. Otherwise ignore silently.
      if (
        supplier &&
        supplier.googleChannelToken &&
        supplier.googleChannelToken === channelToken
      ) {
        await syncSupplierBusyDays(supplier.id);
      }
    }
  } catch (err) {
    console.error("[POST /api/supplier/calendar/webhook]", err);
  }

  return new Response(null, { status: 200 });
}
