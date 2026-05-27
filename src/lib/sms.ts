function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "+972" + digits.slice(1);
  if (digits.startsWith("972")) return "+" + digits;
  return "+" + digits;
}

export async function sendOtp(phone: string, otp: string): Promise<boolean> {
  const isDev = process.env.NODE_ENV !== "production";
  const hasTwilio =
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER;

  if (isDev || !hasTwilio) {
    console.log(`[SMS] OTP for ${phone}: ${otp}`);
    return true;
  }

  try {
    const sid = process.env.TWILIO_ACCOUNT_SID!;
    const auth = process.env.TWILIO_AUTH_TOKEN!;
    const from = process.env.TWILIO_FROM_NUMBER!;
    const to = toE164(phone);
    const message = `קוד האימות שלך ב-פנוי: ${otp}`;

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${auth}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: message }).toString(),
    });

    return res.ok;
  } catch (err) {
    console.error("[SMS] Twilio error:", err);
    return false;
  }
}
