import { NextRequest, NextResponse } from "next/server";
import { runPiiSweep } from "@/lib/pii-sweep";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Manual/alternate trigger for the PII sweep. The daily run is chained from
// /api/cron/renew-calendar-watches (Vercel Hobby cron slot limit).
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runPiiSweep();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[cron/pii-sweep]", err);
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
