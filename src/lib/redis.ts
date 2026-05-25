import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  client.on("error", (err) => {
    console.error("[Redis] Connection error:", err);
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
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
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
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
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch (err) {
    console.error(`[Redis] delCachePattern error for pattern "${pattern}":`, err);
  }
}

export default redis;
