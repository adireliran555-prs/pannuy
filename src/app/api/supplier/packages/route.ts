import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { delCache } from "@/lib/redis";
import { z } from "zod";

const createSchema = z.object({
  nameHe: z.string().trim().min(1).max(200),
  descHe: z.string().max(5000).nullable().optional(),
  price: z.number().int().nonnegative(),
  hours: z.number().int().nonnegative().nullable().optional(),
  includes: z.array(z.string().max(300)).max(50).optional(),
  isPopular: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "שם ומחיר חובה" },
        { status: 400 }
      );
    }
    const { nameHe, descHe, price, hours, includes, isPopular } = parsed.data;

    const pkg = await prisma.supplierPackage.create({
      data: {
        supplierId: session.id,
        nameHe,
        descHe: descHe ?? null,
        price,
        hours: hours ?? null,
        includes: includes ?? [],
        isPopular: isPopular ?? false,
      },
    });

    await delCache(`supplier:${session.slug}`);
    revalidatePath(`/suppliers/${session.slug}`);

    return NextResponse.json({ success: true, data: pkg }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/supplier/packages]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
