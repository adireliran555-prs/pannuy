import { randomUUID } from "node:crypto";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { AvailabilitySource } from "@prisma/client";
import prisma from "@/lib/prisma";
import { jerusalemParts } from "@/lib/timezone";
import { invalidateAvailabilityCache } from "@/lib/availability";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ??
  "http://localhost:3000/api/supplier/calendar/callback";

// ─── OAuth2 client factory ────────────────────────────────────────────────────

export function getOAuthClient(refreshToken?: string): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
  }

  return oauth2Client;
}

// ─── Auth URL ─────────────────────────────────────────────────────────────────

export function getAuthUrl(state: string): string {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    state,
  });
}

// ─── Token exchange ───────────────────────────────────────────────────────────

export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiry: Date;
}> {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Missing tokens in Google OAuth response");
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiry: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
  };
}

// ─── Get supplier OAuth client (auto-refresh) ─────────────────────────────────

async function getSupplierOAuthClient(supplierId: string): Promise<OAuth2Client> {
  const supplier = await prisma.supplier.findUniqueOrThrow({
    where: { id: supplierId },
    select: {
      googleRefreshToken: true,
      googleAccessToken: true,
      googleTokenExpiry: true,
    },
  });

  if (!supplier.googleRefreshToken) {
    throw new Error("Supplier has not connected Google Calendar");
  }

  const oauth2Client = getOAuthClient(supplier.googleRefreshToken);

  if (supplier.googleAccessToken) {
    oauth2Client.setCredentials({
      refresh_token: supplier.googleRefreshToken,
      access_token: supplier.googleAccessToken,
      expiry_date: supplier.googleTokenExpiry?.getTime(),
    });
  }

  // Listen for token refreshes and persist them
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await prisma.supplier.update({
        where: { id: supplierId },
        data: {
          googleAccessToken: tokens.access_token,
          googleTokenExpiry: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : undefined,
        },
      });
    }
  });

  return oauth2Client;
}

// ─── Dedicated Pannuy calendar ────────────────────────────────────────────────

export const PANNUY_CALENDAR_NAME = "פנוי — זמינות";

/**
 * Create (or reuse) a dedicated "פנוי — זמינות" calendar in the supplier's Google
 * account and store its id as the supplier's googleCalendarId. We then sync ONLY
 * this calendar — the supplier adds blocking events to it (privacy-friendly: we
 * never read their personal events). Idempotent and non-fatal.
 */
export async function ensurePannuyCalendar(supplierId: string): Promise<string | null> {
  try {
    const supplier = await prisma.supplier.findUniqueOrThrow({
      where: { id: supplierId },
      select: { googleCalendarId: true },
    });
    if (supplier.googleCalendarId && supplier.googleCalendarId !== "primary") {
      return supplier.googleCalendarId; // already provisioned
    }

    const oauth2Client = await getSupplierOAuthClient(supplierId);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Reuse an existing Pannuy calendar if the supplier already has one.
    const list = await calendar.calendarList.list();
    const existing = list.data.items?.find(
      (c) => c.summary === PANNUY_CALENDAR_NAME
    );

    let calendarId = existing?.id ?? null;
    if (!calendarId) {
      const created = await calendar.calendars.insert({
        requestBody: {
          summary: PANNUY_CALENDAR_NAME,
          description:
            "צרו כאן אירועים כדי לחסום תאריכים בפנוי. רק אירועים ביומן זה נמשכים לאתר.",
          timeZone: "Asia/Jerusalem",
        },
      });
      calendarId = created.data.id ?? null;
    }

    if (calendarId) {
      await prisma.supplier.update({
        where: { id: supplierId },
        data: { googleCalendarId: calendarId },
      });
    }
    return calendarId;
  } catch (err) {
    console.warn("[ensurePannuyCalendar] failed:", err);
    return null;
  }
}

// ─── Busy slots ───────────────────────────────────────────────────────────────

export async function getSupplierBusySlots(
  supplierId: string,
  startDate: Date,
  endDate: Date
): Promise<{ start: string; end: string }[]> {
  const oauth2Client = await getSupplierOAuthClient(supplierId);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const supplier = await prisma.supplier.findUniqueOrThrow({
    where: { id: supplierId },
    select: { googleCalendarId: true },
  });

  const calendarId = supplier.googleCalendarId ?? "primary";

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      items: [{ id: calendarId }],
    },
  });

  const busy = res.data.calendars?.[calendarId]?.busy ?? [];
  return busy
    .filter((b) => b.start && b.end)
    .map((b) => ({ start: b.start!, end: b.end! }));
}

// ─── Busy days (all-day + timed events) ───────────────────────────────────────

export async function getSupplierBusyDays(
  supplierId: string,
  startDate: Date,
  endDate: Date
): Promise<{ dates: string[]; timed: { start: string; end: string }[] }> {
  const oauth2Client = await getSupplierOAuthClient(supplierId);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const supplier = await prisma.supplier.findUniqueOrThrow({
    where: { id: supplierId },
    select: { googleCalendarId: true },
  });

  const calendarId = supplier.googleCalendarId ?? "primary";

  const res = await calendar.events.list({
    calendarId,
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 2500,
  });

  const dates = new Set<string>();
  const timed: { start: string; end: string }[] = [];

  for (const event of res.data.items ?? []) {
    // "transparent" = "free" in Google → must NOT block.
    if (event.transparency === "transparent") continue;

    const startDateStr = event.start?.date;
    const endDateStr = event.end?.date;

    if (startDateStr) {
      // All-day event. Google's `end.date` is exclusive.
      const cursor = new Date(`${startDateStr}T00:00:00Z`);
      const endExclusive = endDateStr
        ? new Date(`${endDateStr}T00:00:00Z`)
        : new Date(cursor.getTime() + 24 * 60 * 60 * 1000);

      while (cursor < endExclusive) {
        dates.add(cursor.toISOString().slice(0, 10));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      continue;
    }

    const startDateTime = event.start?.dateTime;
    const endDateTime = event.end?.dateTime;
    if (startDateTime && endDateTime) {
      timed.push({ start: startDateTime, end: endDateTime });
    }
  }

  return { dates: Array.from(dates), timed };
}

// ─── Sync busy days into AvailabilitySlot (shared helper) ──────────────────────

export async function syncSupplierBusyDays(
  supplierId: string
): Promise<{ synced: number }> {
  const now = new Date();
  const threeMonthsLater = new Date(now);
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

  const { dates, timed } = await getSupplierBusyDays(
    supplierId,
    now,
    threeMonthsLater
  );

  let upsertedCount = 0;

  // All-day events block the entire day.
  for (const date of dates) {
    const googleEventId = `allday-${date}`;
    await prisma.availabilitySlot.upsert({
      where: {
        supplierId_date_googleEventId: {
          supplierId,
          date: new Date(date),
          googleEventId,
        },
      },
      create: {
        supplierId,
        date: new Date(date),
        startTime: "00:00",
        endTime: "23:59",
        isBlocked: true,
        source: AvailabilitySource.GOOGLE,
        googleEventId,
      },
      update: {
        startTime: "00:00",
        endTime: "23:59",
        syncedAt: new Date(),
      },
    });
    upsertedCount++;
  }

  // Timed events block their specific slot. Read the event instants as Israel
  // wall-clock (not the UTC server tz) so the correct local hour is blocked.
  for (const slot of timed) {
    const startParts = jerusalemParts(new Date(slot.start));
    const endParts = jerusalemParts(new Date(slot.end));
    const dateStr = startParts.date;

    const startTime = startParts.time;
    const endTime = endParts.time;
    const googleEventId = `${dateStr}-${startTime}`;

    await prisma.availabilitySlot.upsert({
      where: {
        supplierId_date_googleEventId: {
          supplierId,
          date: new Date(dateStr),
          googleEventId,
        },
      },
      create: {
        supplierId,
        date: new Date(dateStr),
        startTime,
        endTime,
        isBlocked: true,
        source: AvailabilitySource.GOOGLE,
        googleEventId,
      },
      update: {
        startTime,
        endTime,
        syncedAt: new Date(),
      },
    });
    upsertedCount++;
  }

  await invalidateAvailabilityCache(supplierId);

  return { synced: upsertedCount };
}

// ─── Push-notification watch (register / stop) ─────────────────────────────────

export async function registerCalendarWatch(
  supplierId: string
): Promise<{
  channelId: string | null;
  resourceId: string | null;
  expiry: Date | null;
}> {
  try {
    const oauth2Client = await getSupplierOAuthClient(supplierId);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const supplier = await prisma.supplier.findUniqueOrThrow({
      where: { id: supplierId },
      select: { googleCalendarId: true },
    });

    const calendarId = supplier.googleCalendarId ?? "primary";
    // Random, unguessable channel id and secret token. The token is echoed back
    // by Google in the x-goog-channel-token header on every push notification,
    // and we verify it in the webhook handler before trusting the call.
    const channelId = randomUUID();
    const channelToken = randomUUID();
    const baseUrl = process.env.GOOGLE_WEBHOOK_URL ?? "https://pannuy.vercel.app";

    const res = await calendar.events.watch({
      calendarId,
      requestBody: {
        id: channelId,
        type: "web_hook",
        address: `${baseUrl}/api/supplier/calendar/webhook`,
        token: channelToken,
      },
    });

    const resourceId = res.data.resourceId ?? null;
    const expiry = res.data.expiration
      ? new Date(Number(res.data.expiration))
      : null;

    // Persist channel identity + secret token so the webhook can authenticate
    // incoming notifications against this supplier.
    await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        googleChannelId: channelId,
        googleChannelToken: channelToken,
        googleResourceId: resourceId,
        googleChannelExpiry: expiry,
      },
    });

    return {
      channelId,
      resourceId,
      expiry,
    };
  } catch (err) {
    console.error("[registerCalendarWatch]", err);
    return { channelId: null, resourceId: null, expiry: null };
  }
}

export async function stopCalendarWatch(supplierId: string): Promise<void> {
  try {
    const supplier = await prisma.supplier.findUniqueOrThrow({
      where: { id: supplierId },
      select: { googleChannelId: true, googleResourceId: true },
    });

    if (!supplier.googleChannelId || !supplier.googleResourceId) return;

    const oauth2Client = await getSupplierOAuthClient(supplierId);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    await calendar.channels.stop({
      requestBody: {
        id: supplier.googleChannelId,
        resourceId: supplier.googleResourceId,
      },
    });
  } catch (err) {
    console.error("[stopCalendarWatch]", err);
  }
}

// ─── Meeting event details ─────────────────────────────────────────────────────

interface MeetingEventDetails {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  customerName: string;
  customerPhone: string;
  meetingType: string;
  notes?: string | null;
}

export async function createCalendarEvent(
  supplierId: string,
  meeting: MeetingEventDetails
): Promise<string> {
  const oauth2Client = await getSupplierOAuthClient(supplierId);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const supplier = await prisma.supplier.findUniqueOrThrow({
    where: { id: supplierId },
    select: { googleCalendarId: true, name: true },
  });

  const calendarId = supplier.googleCalendarId ?? "primary";

  // Naive local datetime (no offset, no Z). Combined with timeZone below, Google
  // interprets these wall-clock times as Asia/Jerusalem. Applying both
  // .toISOString() (UTC) AND timeZone would double-shift the event.
  const startDateTime = `${meeting.date}T${meeting.startTime}:00`;
  const endDateTime = `${meeting.date}T${meeting.endTime}:00`;

  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `סגור מהאתר: ${meeting.meetingType} - ${meeting.customerName} (טלפון: ${meeting.customerPhone})`,
      description: [
        `סוג פגישה: ${meeting.meetingType}`,
        `טלפון: ${meeting.customerPhone}`,
        meeting.notes ? `הערות: ${meeting.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      start: {
        dateTime: startDateTime,
        timeZone: "Asia/Jerusalem",
      },
      end: {
        dateTime: endDateTime,
        timeZone: "Asia/Jerusalem",
      },
    },
  });

  if (!res.data.id) {
    throw new Error("Google Calendar event creation returned no event ID");
  }

  return res.data.id;
}

export async function deleteCalendarEvent(
  supplierId: string,
  eventId: string
): Promise<void> {
  const oauth2Client = await getSupplierOAuthClient(supplierId);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const supplier = await prisma.supplier.findUniqueOrThrow({
    where: { id: supplierId },
    select: { googleCalendarId: true },
  });

  const calendarId = supplier.googleCalendarId ?? "primary";

  await calendar.events.delete({ calendarId, eventId });
}
