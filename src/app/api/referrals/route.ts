import { NextResponse } from "next/server";

// Off-platform (WhatsApp) contact was removed: the first contact between a
// customer and a supplier is always a scheduled intro meeting. Kept so stale
// clients fail loudly instead of silently.
export async function POST() {
  return NextResponse.json(
    { success: false, error: "יצירת קשר אפשרית רק דרך קביעת פגישת היכרות" },
    { status: 410 }
  );
}
