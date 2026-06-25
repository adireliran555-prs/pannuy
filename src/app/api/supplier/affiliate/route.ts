import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { getAppUrl } from "@/lib/app-url";

function generateAffiliateCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    // Fetch supplier and resolve affiliateCode, generating one if missing
    let supplier = await prisma.supplier.findUnique({
      where: { id: session.id },
      select: { affiliateCode: true },
    });

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "ספק לא נמצא" },
        { status: 404 }
      );
    }

    let affiliateCode = supplier.affiliateCode;

    if (!affiliateCode) {
      // Generate a unique code (retry on collision)
      let saved = false;
      while (!saved) {
        const candidate = generateAffiliateCode();
        try {
          const updated = await prisma.supplier.update({
            where: { id: session.id },
            data: { affiliateCode: candidate },
            select: { affiliateCode: true },
          });
          affiliateCode = updated.affiliateCode!;
          saved = true;
        } catch (updateErr: unknown) {
          // Unique constraint violation — try a new code
          if (
            typeof updateErr === "object" &&
            updateErr !== null &&
            "code" in updateErr &&
            (updateErr as { code: string }).code === "P2002"
          ) {
            continue;
          }
          throw updateErr;
        }
      }
    }

    // Aggregate totals in parallel
    const [earnedAgg, owedAgg, recentEarnings] = await Promise.all([
      prisma.affiliateEarning.aggregate({
        where: {
          referringSupplierId: session.id,
          status: { in: ["CONFIRMED", "PAID"] },
        },
        _sum: { amountIls: true },
      }),
      prisma.affiliateEarning.aggregate({
        where: {
          receivingSupplierId: session.id,
          status: { in: ["CONFIRMED", "PAID"] },
        },
        _sum: { amountIls: true },
      }),
      prisma.affiliateEarning.findMany({
        where: { referringSupplierId: session.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          amountIls: true,
          status: true,
          createdAt: true,
          meeting: { select: { requestedDate: true } },
          receivingSupplier: { select: { name: true, category: true } },
        },
      }),
    ]);

    const earnings = recentEarnings.map((e) => ({
      id: e.id,
      amountIls: e.amountIls,
      status: e.status,
      createdAt: e.createdAt,
      meetingDate: e.meeting.requestedDate,
      supplierName: e.receivingSupplier.name,
      supplierCategory: e.receivingSupplier.category,
    }));

    return NextResponse.json({
      success: true,
      affiliateCode,
      affiliateUrl: `${getAppUrl()}/?ref=${affiliateCode}`,
      totalEarned: earnedAgg._sum.amountIls ?? 0,
      totalOwed: owedAgg._sum.amountIls ?? 0,
      earnings,
    });
  } catch (err) {
    console.error("[GET /api/supplier/affiliate]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
