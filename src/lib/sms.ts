function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "+972" + digits.slice(1);
  if (digits.startsWith("972")) return "+" + digits;
  return "+" + digits;
}

export async function sendOtp(phone: string, otp: string): Promise<boolean> {
  const isDev = process.env.NODE_ENV !== "production";
  const hasTelnyx = process.env.TELNYX_API_KEY && process.env.TELNYX_MESSAGING_PROFILE_ID && process.env.TELNYX_FROM_NUMBER;

  if (isDev || !hasTelnyx) {
    console.log(`[SMS] OTP for ${phone}: ${otp}`);
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
        text: `קוד האימות שלך ב-פנוי: ${otp}`,
      }),
    });

    return res.ok;
  } catch (err) {
    console.error("[SMS] Telnyx error:", err);
    return false;
  }
}
