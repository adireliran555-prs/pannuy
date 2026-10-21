import { redis } from "@/lib/redis";

// Per-IP OTP request limiter. Uses Upstash when configured; otherwise falls back
// to an in-process Map (best-effort on serverless — resets per instance, but
// still blunts single-IP enumeration bursts).
const WINDOW_MS = 60 * 60 * 1000;
const memory = new Map<string, { count: number; resetAt: number }>();

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/** Returns true when the IP is still under `max` hits in the rolling hour. */
export async function checkOtpIpLimit(ip: string, max = 10, scope = "otp"): Promise<boolean> {
  const key = `otp-ip:${scope}:${ip}`;
  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, WINDOW_MS / 1000);
      return count <= max;
    } catch (err) {
      console.error("[otp-ip-limit] redis error:", err);
      // fall through to memory
    }
  }
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (memory.size > 5000) {
      for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k);
    }
    return true;
  }
  entry.count++;
  return entry.count <= max;
}
