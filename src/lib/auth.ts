import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { CustomerSession, SupplierSession } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET ?? "pannuy-jwt-secret-local-dev";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

const BCRYPT_ROUNDS = 4;

// ─── JWT ──────────────────────────────────────────────────────────────────────

export function signCustomerToken(payload: CustomerSession): string {
  return jwt.sign({ ...payload, type: "customer" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function signSupplierToken(payload: SupplierSession): string {
  return jwt.sign({ ...payload, type: "supplier" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(
  token: string
): (CustomerSession & { type: "customer" }) | (SupplierSession & { type: "supplier" }) | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    return decoded as (CustomerSession & { type: "customer" }) | (SupplierSession & { type: "supplier" });
  } catch {
    return null;
  }
}

// ─── OTP ──────────────────────────────────────────────────────────────────────

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, BCRYPT_ROUNDS);
}

export async function verifyOtp(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
