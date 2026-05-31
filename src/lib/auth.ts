import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { CustomerSession, SupplierSession, AdminSession } from "@/types";

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

export function signAdminToken(payload: AdminSession): string {
  return jwt.sign({ ...payload, type: "admin" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(
  token: string
):
  | (CustomerSession & { type: "customer" })
  | (SupplierSession & { type: "supplier" })
  | (AdminSession & { type: "admin" })
  | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    return decoded as
      | (CustomerSession & { type: "customer" })
      | (SupplierSession & { type: "supplier" })
      | (AdminSession & { type: "admin" });
  } catch {
    return null;
  }
}

export function isAdminPhone(phone: string): boolean {
  const list = (process.env.ADMIN_PHONES ?? "").split(",").map((p) => p.trim()).filter(Boolean);
  return list.includes(phone);
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
