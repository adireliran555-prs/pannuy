import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/api-auth";
import { delCache } from "@/lib/redis";
import { z } from "zod";

const createSchema = z.object({
  meetingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  textHe: z.string().max(3000).nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      const ratingIssue = parsed.error.issues.some((i) => i.path[0] === "rating" && i.code !== "invalid_type");
      return NextResponse.json(
        { success: false, error: ratingIssue ? "דירוג חייב להיות בין 1 ל־5" : "meetingId ודירוג חובה" },
        { status: 400 }
      );
    }
    const { meetingId, rating, textHe } = parsed.data;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { supplier: { select: { id: true, slug: true, ratingAvg: true, ratingCount: true } } },
    });

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: "פגישה לא נמצאה" },
        { status: 404 }
      );
    }

    if (meeting.customerId !== session.id) {
      return NextResponse.json(
        { success: false, error: "אין הרשאה" },
        { status: 403 }
      );
    }

    if (meeting.status !== "COMPLETED") {
      return NextResponse.json(
        { success: false, error: "ניתן להוסיף ביקורת רק לפגישות שהושלמו" },
        { status: 400 }
      );
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: { meetingId },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: "כבר נכתבה ביקורת לפגישה זו" },
        { status: 409 }
      );
    }

    const supplierId = meeting.supplierId;

    // Create review and update supplier rating atomically
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          customerId: session.id,
          supplierId,
          meetingId,
          rating,
          textHe: textHe ?? null,
        },
      });

      // Recalculate running average
      const { ratingAvg, ratingCount } = meeting.supplier;
      const newCount = ratingCount + 1;
      const newAvg = (ratingAvg * ratingCount + rating) / newCount;

      await tx.supplier.update({
        where: { id: supplierId },
        data: { ratingAvg: newAvg, ratingCount: newCount },
      });

      return newReview;
    });

    await delCache(`supplier:${meeting.supplier.slug}`);
    revalidatePath(`/suppliers/${meeting.supplier.slug}`);

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/reviews]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
