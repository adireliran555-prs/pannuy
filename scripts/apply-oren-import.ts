import prisma from "../src/lib/prisma";
import { mirrorImagesParallel } from "../src/lib/cloudinary-server";
import { resolveSiteImport } from "../src/lib/landing-import";
import { PhotoType } from "@prisma/client";

const SUPPLIER_ID = "fa3dfdee-72ee-461b-bcc4-727511598411";
const START_URL = "https://www.orensonego.co.il/";

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; PannuyBot/1.0)",
  Accept: "text/html",
};

async function fetchHtml(url: string) {
  const res = await fetch(url, { headers: FETCH_HEADERS, redirect: "follow" });
  if (!res.ok) return null;
  return { html: (await res.text()).slice(0, 1_500_000), finalUrl: res.url || url };
}

async function main() {
  const started = Date.now();
  const { parsed, followedUrls } = await resolveSiteImport(START_URL, fetchHtml);
  console.log("Merged import:", {
    followedUrls,
    name: parsed.name,
    bioLen: parsed.bioHe?.length,
    bio: parsed.bioHe?.slice(0, 160),
    prices: [parsed.basePriceFrom, parsed.basePriceTo],
    packages: parsed.packages,
    images: parsed.rawImages.length,
  });

  const mirrored = await mirrorImagesParallel(parsed.rawImages, 3);
  console.log("Mirrored", mirrored.length, "images in", Date.now() - started, "ms");

  await prisma.supplierPhoto.deleteMany({ where: { supplierId: SUPPLIER_ID } });
  await prisma.supplierPackage.deleteMany({ where: { supplierId: SUPPLIER_ID } });

  await prisma.supplier.update({
    where: { id: SUPPLIER_ID },
    data: {
      name: parsed.name ?? undefined,
      bioHe: parsed.bioHe ?? undefined,
      email: parsed.email ?? undefined,
      category: parsed.category as never,
      serviceAreas: parsed.serviceAreas,
      basePriceFrom: parsed.basePriceFrom,
      basePriceTo: parsed.basePriceTo,
    },
  });

  for (const [idx, img] of mirrored.entries()) {
    await prisma.supplierPhoto.create({
      data: {
        supplierId: SUPPLIER_ID,
        cloudinaryUrl: img.url,
        publicId: img.publicId,
        type: idx === 0 ? PhotoType.COVER : idx === 1 ? PhotoType.PROFILE : PhotoType.PORTFOLIO,
        sortOrder: idx,
      },
    });
  }

  for (const pkg of parsed.packages.filter((p) => p.price > 0).slice(0, 3)) {
    await prisma.supplierPackage.create({
      data: {
        supplierId: SUPPLIER_ID,
        nameHe: pkg.nameHe,
        price: pkg.price,
        hours: pkg.hours ?? null,
        includes: pkg.includes,
        isPopular: pkg.isPopular,
      },
    });
  }

  const result = await prisma.supplier.findUnique({
    where: { id: SUPPLIER_ID },
    include: { photos: true, packages: true },
  });
  console.log(
    JSON.stringify(
      {
        name: result?.name,
        bioLen: result?.bioHe?.length,
        prices: [result?.basePriceFrom, result?.basePriceTo],
        photoCount: result?.photos.length,
        photoUrls: result?.photos.slice(0, 3).map((p) => p.cloudinaryUrl),
        packages: result?.packages,
      },
      null,
      2
    )
  );

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
