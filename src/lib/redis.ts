import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
});

export async function getCache<T>(key: string): Promise<T | null> {
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
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.error(`[Redis] setCache error for key "${key}":`, err);
  }
}

export async function delCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    console.error(`[Redis] delCache error for key "${key}":`, err);
  }
}

export async function delCachePattern(pattern: string): Promise<void> {
  try {
    let cursor = 0;
    do {
      const result: [number, string[]] = await redis.scan(cursor, {
        match: pattern,
        count: 100,
      });
      cursor = result[0];
      if (result[1].length > 0) {
        await redis.del(...result[1]);
      }
    } while (cursor !== 0);
  } catch (err) {
    console.error(`[Redis] delCachePattern error for pattern "${pattern}":`, err);
  }
}

export default redis;
