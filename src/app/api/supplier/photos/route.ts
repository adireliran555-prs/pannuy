import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { delCache } from "@/lib/redis";
import { maybeActivateSupplierListing } from "@/lib/supplier-activation";
import { scanImageForPhone, deleteCloudinaryAsset } from "@/lib/cloudinary-ocr";
import { recordPiiViolation } from "@/lib/pii-warning";
import { requestMeta } from "@/lib/activity";
import { PhotoType } from "@prisma/client";
import { isOwnCloudinaryUrl } from "@/lib/cloudinary-server";

export async function POST(request: NextRequest) {
  try {
    const { session, error } = requireSupplierSession(request);
    if (error) return error;

    const body = await request.json();
    const { url, publicId, type, sortOrder } = body as {
      url?: string;
      publicId?: string;
      type?: string;
      sortOrder?: number;
    };

    if (!url || !publicId) {
      return NextResponse.json(
        { success: false, error: "url ו־publicId חובה" },
        { status: 400 }
      );
    }

    // Only accept images uploaded to our own Cloudinary account — otherwise the
    // OCR phone scan could be bypassed with an arbitrary external URL.
    if (!isOwnCloudinaryUrl(url, publicId)) {
      return NextResponse.json(
        { success: false, error: "כתובת תמונה לא תקינה" },
        { status: 400 }
      );
    }

    // Never allow a phone number printed on an image — suppliers must be
    // reachable only through the app. Reject (and remove) any image whose OCR
    // text contains an Israeli phone number.
    const scan = await scanImageForPhone(url);
    if (scan.status === "flagged") {
      console.warn(`[photos] rejected image with phone for supplier ${session.id}: ${scan.matched}`);
      await deleteCloudinaryAsset(publicId);
      await recordPiiViolation(session.id, {
        field: "photo",
        hits: [{ kind: "phone", match: scan.matched ?? "", index: 0 }],
        source: "photo",
        meta: requestMeta(request),
      }).catch(() => {});
      return NextResponse.json(
        {
          success: false,
          code: "PHONE_IN_IMAGE",
          error:
            "לא ניתן להעלות תמונה שמכילה מספר טלפון. אנא הסירו את המספר מהתמונה ונסו שוב — יצירת הקשר נעשית דרך האתר בלבד.",
        },
        { status: 422 }
      );
    }

    const photoType =
      type && Object.values(PhotoType).includes(type as PhotoType)
        ? (type as PhotoType)
        : PhotoType.PORTFOLIO;

    // Never fail open: if OCR couldn't run (quota/outage) the photo is stored as
    // PENDING and hidden from customers until the daily sweep clears it.
    const pendingReview = scan.status === "unavailable";
    if (pendingReview) console.warn(`[photos] OCR unavailable (${scan.reason}) — photo pending for supplier ${session.id}`);

    const photo = await prisma.supplierPhoto.create({
      data: {
        supplierId: session.id,
        cloudinaryUrl: url,
        publicId,
        type: photoType,
        sortOrder: sortOrder ?? 0,
        piiScanStatus: pendingReview ? "PENDING" : "CLEAN",
        piiScannedAt: pendingReview ? null : new Date(),
      },
    });

    await delCache(`supplier:${session.slug}`);
    revalidatePath(`/suppliers/${session.slug}`);
    await maybeActivateSupplierListing(session.id);

    return NextResponse.json(
      {
        success: true,
        data: photo,
        ...(pendingReview
          ? { pendingReview: true, message: "התמונה נשמרה ותוצג ללקוחות לאחר בדיקה אוטומטית" }
          : {}),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/supplier/photos]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
