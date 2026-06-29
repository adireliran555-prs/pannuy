import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSupplierSession } from "@/lib/api-auth";
import { delCache } from "@/lib/redis";
import { maybeActivateSupplierListing } from "@/lib/supplier-activation";
import { scanImageForPhone, deleteCloudinaryAsset } from "@/lib/cloudinary-ocr";
import { PhotoType } from "@prisma/client";

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
        { success: false, error: "url ו-publicId חובה" },
        { status: 400 }
      );
    }

    // Never allow a phone number printed on an image — suppliers must be
    // reachable only through the app. Reject (and remove) any image whose OCR
    // text contains an Israeli phone number.
    const scan = await scanImageForPhone(publicId);
    if (scan.hasPhone) {
      console.warn(`[photos] rejected image with phone for supplier ${session.id}: ${scan.matched}`);
      await deleteCloudinaryAsset(publicId);
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

    const photo = await prisma.supplierPhoto.create({
      data: {
        supplierId: session.id,
        cloudinaryUrl: url,
        publicId,
        type: photoType,
        sortOrder: sortOrder ?? 0,
      },
    });

    await delCache(`supplier:${session.slug}`);
    await maybeActivateSupplierListing(session.id);

    return NextResponse.json({ success: true, data: photo }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/supplier/photos]", err);
    return NextResponse.json(
      { success: false, error: "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
