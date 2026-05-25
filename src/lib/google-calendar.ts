import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import prisma from "@/lib/prisma";

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

export function getAuthUrl(supplierId: string): string {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    state: supplierId,
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

  const startDateTime = new Date(`${meeting.date}T${meeting.startTime}:00`);
  const endDateTime = new Date(`${meeting.date}T${meeting.endTime}:00`);

  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `פגישה עם ${meeting.customerName} - פנוי`,
      description: [
        `סוג פגישה: ${meeting.meetingType}`,
        `טלפון: ${meeting.customerPhone}`,
        meeting.notes ? `הערות: ${meeting.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: "Asia/Jerusalem",
      },
      end: {
        dateTime: endDateTime.toISOString(),
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
