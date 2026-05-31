import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

// Short-circuit when Upstash isn't configured. The default REST client
// otherwise eats ~10s timing out before failing — that wait blocks every
// request that consults the cache or rate limiter.
const isConfigured = Boolean(url && token);

if (!isConfigured && process.env.NODE_ENV === "production") {
  console.warn(
    "[Redis] UPSTASH_REDIS_REST_URL/TOKEN not set — cache and OTP rate limit are no-ops."
  );
}

export const redis: Redis | null = isConfigured
  ? new Redis({ url: url!, token: token! })
  : null;

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch (err) {
    console.error(`[Redis] getCache error for key "${key}":`, err);
    return null;
  }
}

export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.error(`[Redis] setCache error for key "${key}":`, err);
  }
}

export async function delCache(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.error(`[Redis] delCache error for key "${key}":`, err);
  }
}

export async function delCachePattern(pattern: string): Promise<void> {
  if (!redis) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cursor: any = 0;
    do {
      const result = await redis.scan(cursor, { match: pattern, count: 100 });
      cursor = result[0];
      const keys = result[1] as string[];
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== 0);
  } catch (err) {
    console.error(`[Redis] delCachePattern error for pattern "${pattern}":`, err);
  }
}

export default redis;
