// Admin audit helper: logs an ADMIN_ACTION on every mutating admin route.
import type { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/api-auth";
import { logEventAsync, requestMeta, ActivityType } from "@/lib/activity";
import type { Prisma } from "@prisma/client";

export function logAdminAction(
  request: NextRequest,
  input: {
    route: string;
    targetType?: string;
    targetId?: string | null;
    customerId?: string | null;
    supplierId?: string | null;
    body?: unknown;
  }
): void {
  const admin = getAdminSession(request);
  logEventAsync({
    type: ActivityType.ADMIN_ACTION,
    actorType: "admin",
    actorId: admin?.phone ?? null,
    customerId: input.customerId ?? null,
    supplierId: input.supplierId ?? null,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    payload: {
      route: input.route,
      method: request.method,
      targetId: input.targetId ?? null,
      body: (input.body ?? null) as Prisma.InputJsonValue,
    } as Prisma.InputJsonValue,
    meta: requestMeta(request),
  });
}
