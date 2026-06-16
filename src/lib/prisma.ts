import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma_pg: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const raw = process.env.DATABASE_URL ?? "";
  let connectionString =
    raw.startsWith("postgresql://") || raw.startsWith("postgres://")
      ? raw
      : "postgresql://pannuy:pannuy_local@localhost:5432/pannuy_dev";

  const isSupabase = connectionString.includes("supabase.com");

  const adapter = new PrismaPg({
    // Strip sslmode from URL so the ssl config below takes full control
    connectionString: isSupabase
      ? connectionString.replace(/[?&]sslmode=[^&]*/g, "").replace(/[?&]$/, "")
      : connectionString,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    // Cap at 1 connection per serverless instance. The Supabase session pooler
    // (port 5432) holds one server connection per client session and is capped
    // at pool_size 15 — the default pg pool (max 10) per warm Vercel instance
    // exhausts it after ~2 instances → EMAXCONNSESSION, which 500s auth, search
    // and the homepage. With max:1, up to 15 instances can run concurrently.
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma_pg ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma_pg = prisma;
}

export default prisma;
