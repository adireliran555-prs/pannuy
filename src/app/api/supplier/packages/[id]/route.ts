import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { delCache } from "@/lib/redis";

async function getOwnedPackage(id: string, supplierId: string) {
  const pkg = await prisma.supplierPackage.findUnique({ where: { id } });
  if (!pkg) return { pkg: null, error: "חבילה לא נמצאה", status: 404 };
  if (pkg.supplierId !== supplierId) return { pkg: null, error: "אין הרשאה", status: 403 };
  return { pkg, error: null, status: 200 };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const { id } = await params;
    const { pkg, error: pkgError, status } = await getOwnedPackage(id, session.id);
    if (pkgError || !pkg) {
      return NextResponse.json({ success: false, error: pkgError }, { status });
    }

    const body = await request.json();
    const { nameHe, descHe, price, hours, includes, isPopular } = body as {
      nameHe?: string;
      descHe?: string;
      price?: number;
      hours?: number;
      includes?: string[];
      isPopular?: boolean;
    };

    const updated = await prisma.supplierPackage.update({
      where: { id },
      data: {
        ...(nameHe !== undefined ? { nameHe } : {}),
        ...(descHe !== undefined ? { descHe } : {}),
        ...(price !== undefined ? { price } : {}),
        ...(hours !== undefined ? { hours } : {}),
        ...(includes !== undefined ? { includes } : {}),
        ...(isPopular !== undefined ? { isPopular } : {}),
      },
    });

    await delCache(`supplier:${session.slug}`);
    revalidatePath(`/suppliers/${session.slug}`);

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /api/supplier/packages/[id]]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const { id } = await params;
    const { pkg, error: pkgError, status } = await getOwnedPackage(id, session.id);
    if (pkgError || !pkg) {
      return NextResponse.json({ success: false, error: pkgError }, { status });
    }

    await prisma.supplierPackage.delete({ where: { id } });
    await delCache(`supplier:${session.slug}`);
    revalidatePath(`/suppliers/${session.slug}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/supplier/packages/[id]]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
