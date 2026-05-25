import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/api-auth";
import { delCache } from "@/lib/redis";

export async function POST(request: NextRequest) {
  try {
    const { session, error } = requireCustomerSession(request);
    if (error) return error;

    const body = await request.json();
    const { meetingId, rating, textHe } = body as {
      meetingId?: string;
      rating?: number;
      textHe?: string;
    };

    if (!meetingId || rating === undefined) {
      return NextResponse.json(
        { success: false, error: "meetingId ודירוג חובה" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "דירוג חייב להיות בין 1 ל-5" },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/reviews]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
