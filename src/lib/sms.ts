// SMS provider abstraction.
// In local dev, we mock with console.log.
// Replace the `sendViaSmsProvider` function body with a real API call in production.

export async function sendOtp(phone: string, otp: string): Promise<boolean> {
  if (process.env.NODE_ENV !== "production" || !process.env.SMS_API_KEY) {
    console.log(`[SMS] Sending OTP ${otp} to ${phone}`);
    return true;
  }

  return sendViaSmsProvider(phone, otp);
}

async function sendViaSmsProvider(phone: string, otp: string): Promise<boolean> {
  // TODO: wire in your SMS provider (e.g. Twilio, 019, Vonage).
  // Example shape:
  // const res = await fetch("https://api.smsprovider.com/send", {
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${process.env.SMS_API_KEY}`, "Content-Type": "application/json" },
  //   body: JSON.stringify({ to: phone, message: `קוד האימות שלך ב-פנוי: ${otp}` }),
  // });
  // return res.ok;
  console.log(`[SMS] Sending OTP ${otp} to ${phone}`);
  return true;
}
