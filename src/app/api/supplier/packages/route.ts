import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { delCache } from "@/lib/redis";

export async function POST(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const body = await request.json();
    const { nameHe, descHe, price, hours, includes, isPopular } = body as {
      nameHe?: string;
      descHe?: string;
      price?: number;
      hours?: number;
      includes?: string[];
      isPopular?: boolean;
    };

    if (!nameHe || price === undefined) {
      return NextResponse.json(
        { success: false, error: "שם ומחיר חובה" },
        { status: 400 }
      );
    }

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
