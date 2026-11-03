import { randomInt } from "crypto";
import prisma from "@/lib/prisma";

export const AGENT_CODE_PREFIX = "AG";
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function isAgentCode(code: string | null | undefined): code is string {
  return !!code && /^AG[A-Z0-9]{6}$/.test(code);
}

export async function generateAgentCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    let code = AGENT_CODE_PREFIX;
    for (let j = 0; j < 6; j++) code += CODE_CHARS[randomInt(CODE_CHARS.length)];
    const exists = await prisma.agent.findUnique({ where: { referralCode: code }, select: { id: true } });
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique agent code");
}

/** Resolves a `pannuy_ref` cookie value to an active agent id, or null. */
export async function resolveAgentReferral(refCode: string | null | undefined): Promise<string | null> {
  if (!isAgentCode(refCode)) return null;
  const agent = await prisma.agent.findUnique({
    where: { referralCode: refCode },
    select: { id: true, isActive: true },
  });
  return agent?.isActive ? agent.id : null;
}
