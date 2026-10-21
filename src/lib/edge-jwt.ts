import { jwtVerify } from "jose";

// Edge-safe JWT verification (middleware). Must match src/lib/auth.ts:
// jsonwebtoken default algorithm HS256 with JWT_SECRET (dev fallback).
function secretBytes(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (secret) return new TextEncoder().encode(secret);
  if (process.env.NODE_ENV === "production") return null;
  return new TextEncoder().encode("pannuy-jwt-secret-local-dev");
}

export async function verifyJwtEdge(
  token: string
): Promise<Record<string, unknown> | null> {
  const secret = secretBytes();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}
