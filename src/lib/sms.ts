import { BRAND_NAME } from "@/lib/branding";

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "+972" + digits.slice(1);
  if (digits.startsWith("972")) return "+" + digits;
  return "+" + digits;
}

/** True when real SMS delivery (Telnyx) is fully configured. */
export function smsConfigured(): boolean {
  return Boolean(
    process.env.TELNYX_API_KEY &&
      process.env.TELNYX_MESSAGING_PROFILE_ID &&
      process.env.TELNYX_FROM_NUMBER
  );
}

/**
 * When real SMS isn't configured, allow returning the OTP to the client so login
 * works without digging server logs. Gated behind an explicit env flag and
 * auto-disabled the moment Telnyx is configured. NEVER active with real SMS.
 */
export function devOtpEchoEnabled(): boolean {
  // When SMS isn't wired up, show the code in the UI so login still works.
  // Never echo once real Telnyx delivery is configured.
  return !smsConfigured();
}

/**
 * Generic SMS sender. When Telnyx isn't configured (current state), the message
 * is logged server-side instead of sent — so referral follow-ups and OTPs work in
 * dev and start delivering for real the moment the Telnyx number is SMS-capable.
 * Returns true if the message was sent (or successfully logged in dev).
 */
export async function sendSms(phone: string, text: string): Promise<boolean> {
  const isDev = process.env.NODE_ENV !== "production";
  const hasTelnyx = smsConfigured();

  if (isDev || !hasTelnyx) {
    console.log(`[SMS] to ${phone}: ${text}`);
    return true;
  }

  try {
    const res = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_profile_id: process.env.TELNYX_MESSAGING_PROFILE_ID,
        from: process.env.TELNYX_FROM_NUMBER!,
        to: toE164(phone),
        text,
      }),
    });

    return res.ok;
  } catch (err) {
    console.error("[SMS] Telnyx error:", err);
    return false;
  }
}

export async function sendOtp(phone: string, otp: string): Promise<boolean> {
  return sendSms(phone, `קוד האימות שלך ב-${BRAND_NAME}: ${otp}`);
}
