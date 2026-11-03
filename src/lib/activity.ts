// Append-only evidence trail. See prisma ActivityEvent.
//
// Every call appends one row, hash-chained to the previous row (sha256 over the
// previous hash + canonical event fields) so the sequence can later be verified
// as unmodified. Writes are best-effort: a logging failure must never break the
// user-facing action, so callers do not need to await or try/catch.

import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import type { Prisma, ActivityEvent as ActivityEventRow } from "@prisma/client";
import prisma from "@/lib/prisma";

export const ActivityType = {
  PROFILE_VIEW: "PROFILE_VIEW",
  SUPPLIER_CONTACT_EXPOSED: "SUPPLIER_CONTACT_EXPOSED", // customer saw the supplier's phone
  CUSTOMER_CONTACT_EXPOSED: "CUSTOMER_CONTACT_EXPOSED", // supplier saw the customer's phone
  WHATSAPP_TAP: "WHATSAPP_TAP",
  SUPPLIER_SAVED: "SUPPLIER_SAVED",
  SUPPLIER_UNSAVED: "SUPPLIER_UNSAVED",
  MEETING_REQUESTED: "MEETING_REQUESTED",
  MEETING_CONFIRMED: "MEETING_CONFIRMED",
  MEETING_REJECTED: "MEETING_REJECTED",
  MEETING_CANCELLED: "MEETING_CANCELLED",
  MEETING_COMPLETED: "MEETING_COMPLETED",
  REVIEW_CREATED: "REVIEW_CREATED",
  REFERRAL_FOLLOWUP_SENT: "REFERRAL_FOLLOWUP_SENT",
  CUSTOMER_OUTCOME_REPORTED: "CUSTOMER_OUTCOME_REPORTED",
  DEAL_REPORTED: "DEAL_REPORTED",
  DEAL_REPORT_STATUS_CHANGED: "DEAL_REPORT_STATUS_CHANGED",
  CUSTOMER_LOGIN: "CUSTOMER_LOGIN",
  SUPPLIER_LOGIN: "SUPPLIER_LOGIN",
  SUPPLIER_PROFILE_UPDATED: "SUPPLIER_PROFILE_UPDATED",
  ADMIN_ACTION: "ADMIN_ACTION",
  AGENT_EARNING_CREATED: "AGENT_EARNING_CREATED",
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export type ActorType = "customer" | "supplier" | "admin" | "agent" | "system" | "anonymous";

export interface RequestMeta {
  ip?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
}

export interface LogEventInput {
  type: ActivityType;
  actorType: ActorType;
  actorId?: string | null;
  customerId?: string | null;
  supplierId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  payload?: Prisma.InputJsonValue | null;
  meta?: RequestMeta | null;
}

const SESSION_COOKIES = [
  "pannuy_session",
  "pannuy_supplier_session",
  "pannuy_admin_session",
  "pannuy_agent_session",
];

/** Extracts IP, user agent and a hashed session id from the request. */
export function requestMeta(request: NextRequest | Request | null | undefined): RequestMeta {
  if (!request) return {};
  const h = request.headers;
  const ip =
    h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = h.get("user-agent")?.slice(0, 500) ?? null;
  let sessionId: string | null = null;
  const cookies = (request as NextRequest).cookies;
  if (cookies && typeof cookies.get === "function") {
    for (const name of SESSION_COOKIES) {
      const v = cookies.get(name)?.value;
      if (v) {
        sessionId = createHash("sha256").update(v).digest("hex").slice(0, 32);
        break;
      }
    }
  }
  return { ip, userAgent, sessionId };
}

function canonical(input: LogEventInput, prevHash: string | null, createdAt: string): string {
  return JSON.stringify({
    prevHash,
    createdAt,
    type: input.type,
    actorType: input.actorType,
    actorId: input.actorId ?? null,
    customerId: input.customerId ?? null,
    supplierId: input.supplierId ?? null,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    payload: input.payload ?? null,
    ip: input.meta?.ip ?? null,
    userAgent: input.meta?.userAgent ?? null,
    sessionId: input.meta?.sessionId ?? null,
  });
}

export function computeEventHash(input: LogEventInput, prevHash: string | null, createdAt: Date): string {
  return createHash("sha256").update(canonical(input, prevHash, createdAt.toISOString())).digest("hex");
}

/**
 * Appends an event. Serialised through a transaction-level advisory lock so the
 * hash chain never forks under concurrent writes. Never throws.
 */
export async function logEvent(input: LogEventInput): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(7741001)`;
      const last = await tx.activityEvent.findFirst({
        orderBy: { seq: "desc" },
        select: { hash: true },
      });
      const prevHash = last?.hash ?? null;
      const createdAt = new Date();
      const hash = computeEventHash(input, prevHash, createdAt);
      await tx.activityEvent.create({
        data: {
          type: input.type,
          actorType: input.actorType,
          actorId: input.actorId ?? null,
          customerId: input.customerId ?? null,
          supplierId: input.supplierId ?? null,
          targetType: input.targetType ?? null,
          targetId: input.targetId ?? null,
          payload: input.payload ?? undefined,
          ip: input.meta?.ip ?? null,
          userAgent: input.meta?.userAgent ?? null,
          sessionId: input.meta?.sessionId ?? null,
          prevHash,
          hash,
          createdAt,
        },
      });
    });
  } catch (err) {
    console.error("[activity] failed to log", input.type, err);
  }
}

/** Fire-and-forget wrapper for use inside request handlers. */
export function logEventAsync(input: LogEventInput): void {
  void logEvent(input);
}

/**
 * Walks the chain and verifies every hash. Returns the first broken seq, if any.
 */
export async function verifyChain(batch = 1000): Promise<{ ok: boolean; checked: number; brokenAtSeq?: string }> {
  let cursor: bigint | null = null;
  let prevHash: string | null = null;
  let checked = 0;
  for (;;) {
    const rows: ActivityEventRow[] = await prisma.activityEvent.findMany({
      where: cursor === null ? {} : { seq: { gt: cursor } },
      orderBy: { seq: "asc" },
      take: batch,
    });
    if (rows.length === 0) break;
    for (const r of rows) {
      const expected = computeEventHash(
        {
          type: r.type as ActivityType,
          actorType: r.actorType as ActorType,
          actorId: r.actorId,
          customerId: r.customerId,
          supplierId: r.supplierId,
          targetType: r.targetType,
          targetId: r.targetId,
          payload: (r.payload ?? null) as Prisma.InputJsonValue | null,
          meta: { ip: r.ip, userAgent: r.userAgent, sessionId: r.sessionId },
        },
        prevHash,
        r.createdAt
      );
      if (r.prevHash !== prevHash || r.hash !== expected) {
        return { ok: false, checked, brokenAtSeq: r.seq.toString() };
      }
      prevHash = r.hash;
      checked++;
      cursor = r.seq;
    }
  }
  return { ok: true, checked };
}
