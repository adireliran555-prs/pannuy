// Shared filter → Prisma where for the admin evidence trail (list + CSV export).
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export interface EvidenceFilters {
  customerId?: string | null;
  supplierId?: string | null;
  customerQuery?: string | null; // name or phone
  supplierQuery?: string | null; // name or slug
  type?: string | null;
  from?: string | null; // YYYY-MM-DD
  to?: string | null;
}

export function parseEvidenceFilters(sp: URLSearchParams): EvidenceFilters {
  const pick = (k: string) => {
    const v = sp.get(k)?.trim();
    return v ? v.slice(0, 200) : null;
  };
  return {
    customerId: pick("customerId"),
    supplierId: pick("supplierId"),
    customerQuery: pick("customer"),
    supplierQuery: pick("supplier"),
    type: pick("type"),
    from: pick("from"),
    to: pick("to"),
  };
}

export async function buildEvidenceWhere(f: EvidenceFilters): Promise<Prisma.ActivityEventWhereInput> {
  const where: Prisma.ActivityEventWhereInput = {};
  let customerIds: string[] | null = f.customerId ? [f.customerId] : null;
  let supplierIds: string[] | null = f.supplierId ? [f.supplierId] : null;

  if (f.customerQuery) {
    const digits = f.customerQuery.replace(/\D/g, "");
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: f.customerQuery, mode: "insensitive" } },
          ...(digits.length >= 4 ? [{ phone: { contains: digits } }] : []),
        ],
      },
      select: { id: true },
      take: 200,
    });
    const ids = users.map((u) => u.id);
    customerIds = customerIds ? customerIds.filter((id) => ids.includes(id)) : ids;
    if (customerIds.length === 0) customerIds = ["__none__"];
  }
  if (f.supplierQuery) {
    const sups = await prisma.supplier.findMany({
      where: {
        OR: [
          { name: { contains: f.supplierQuery, mode: "insensitive" } },
          { slug: { contains: f.supplierQuery, mode: "insensitive" } },
          { phone: { contains: f.supplierQuery.replace(/\D/g, "") || "__none__" } },
        ],
      },
      select: { id: true },
      take: 200,
    });
    const ids = sups.map((s) => s.id);
    supplierIds = supplierIds ? supplierIds.filter((id) => ids.includes(id)) : ids;
    if (supplierIds.length === 0) supplierIds = ["__none__"];
  }

  if (customerIds) where.customerId = { in: customerIds };
  if (supplierIds) where.supplierId = { in: supplierIds };
  if (f.type) where.type = f.type;
  if (f.from || f.to) {
    where.createdAt = {
      ...(f.from ? { gte: new Date(`${f.from}T00:00:00+02:00`) } : {}),
      ...(f.to ? { lte: new Date(`${f.to}T23:59:59+02:00`) } : {}),
    };
  }
  return where;
}

export interface EvidenceRow {
  seq: string;
  id: string;
  type: string;
  actorType: string;
  actorId: string | null;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  supplierId: string | null;
  supplierName: string | null;
  targetType: string | null;
  targetId: string | null;
  payload: unknown;
  ip: string | null;
  userAgent: string | null;
  sessionId: string | null;
  hash: string;
  prevHash: string | null;
  createdAt: string;
}

export async function fetchEvidence(
  where: Prisma.ActivityEventWhereInput,
  opts: { take: number; cursorSeq?: bigint | null; order?: "asc" | "desc" }
): Promise<{ rows: EvidenceRow[]; nextCursor: string | null }> {
  const order = opts.order ?? "desc";
  const events = await prisma.activityEvent.findMany({
    where: {
      ...where,
      ...(opts.cursorSeq != null
        ? { seq: order === "desc" ? { lt: opts.cursorSeq } : { gt: opts.cursorSeq } }
        : {}),
    },
    orderBy: { seq: order },
    take: opts.take + 1,
  });
  const hasMore = events.length > opts.take;
  const page = hasMore ? events.slice(0, opts.take) : events;

  const customerIds = [...new Set(page.map((e) => e.customerId).filter((x): x is string => !!x))];
  const supplierIds = [...new Set(page.map((e) => e.supplierId).filter((x): x is string => !!x))];
  const [users, sups] = await Promise.all([
    customerIds.length
      ? prisma.user.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true, phone: true } })
      : Promise.resolve([]),
    supplierIds.length
      ? prisma.supplier.findMany({ where: { id: { in: supplierIds } }, select: { id: true, name: true } })
      : Promise.resolve([]),
  ]);
  const uMap = new Map(users.map((u) => [u.id, u]));
  const sMap = new Map(sups.map((s) => [s.id, s]));

  const rows: EvidenceRow[] = page.map((e) => ({
    seq: e.seq.toString(),
    id: e.id,
    type: e.type,
    actorType: e.actorType,
    actorId: e.actorId,
    customerId: e.customerId,
    customerName: e.customerId ? uMap.get(e.customerId)?.name ?? null : null,
    customerPhone: e.customerId ? uMap.get(e.customerId)?.phone ?? null : null,
    supplierId: e.supplierId,
    supplierName: e.supplierId ? sMap.get(e.supplierId)?.name ?? null : null,
    targetType: e.targetType,
    targetId: e.targetId,
    payload: e.payload,
    ip: e.ip,
    userAgent: e.userAgent,
    sessionId: e.sessionId,
    hash: e.hash,
    prevHash: e.prevHash,
    createdAt: e.createdAt.toISOString(),
  }));
  return { rows, nextCursor: hasMore ? page[page.length - 1].seq.toString() : null };
}
