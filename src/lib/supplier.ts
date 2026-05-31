// Shared shape + normalizer for the supplier profile.
// Used by both the server page (RSC) and the SWR hook for client routes
// that haven't been converted yet, so the rendered shape stays identical.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSupplier(s: any) {
  const profilePhoto =
    s.photos?.find((p: { type: string }) => p.type === "PROFILE")
      ?.cloudinaryUrl ??
    s.photos?.find((p: { type: string }) => p.type === "PORTFOLIO")
      ?.cloudinaryUrl ??
    "/placeholder-supplier.svg";
  const coverPhoto =
    s.photos?.find((p: { type: string }) => p.type === "COVER")
      ?.cloudinaryUrl ?? profilePhoto;
  const portfolioPhotos =
    s.photos
      ?.filter((p: { type: string }) => p.type === "PORTFOLIO")
      .map((p: { cloudinaryUrl: string }) => p.cloudinaryUrl) ?? [];

  return {
    ...s,
    profilePhoto,
    coverPhoto,
    portfolio: portfolioPhotos,
    portfolioPhotos,
    bio: s.bioHe ?? s.bio ?? "",
    areas: s.serviceAreas ?? s.areas ?? [],
    rating: s.ratingAvg ?? s.rating ?? 0,
    priceFrom: s.basePriceFrom ?? s.priceFrom ?? 0,
    priceTo: s.basePriceTo ?? s.priceTo,
    responseRate: s.responseRate != null ? Math.round(s.responseRate * 100) : 95,
    responseTime: s.responseTime ?? 2,
    isAvailable: s.isAvailable ?? null,
    reviews: (s.reviews ?? []).map(
      (r: {
        customer?: { name?: string };
        textHe?: string;
        text?: string;
        createdAt?: string | Date;
        date?: string | Date;
        [key: string]: unknown;
      }) => ({
        ...r,
        text: r.textHe ?? r.text ?? "",
        reviewerName: r.customer?.name ?? "אורח",
        date:
          (r.date instanceof Date ? r.date.toISOString() : r.date) ??
          (r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : r.createdAt) ??
          new Date().toISOString(),
      })
    ),
  };
}

export type NormalizedSupplier = ReturnType<typeof normalizeSupplier>;
