import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma_pg: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const raw = process.env.DATABASE_URL ?? "";
  const connectionString =
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
