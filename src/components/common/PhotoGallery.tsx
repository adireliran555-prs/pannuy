"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoGalleryProps {
  photos: string[];
  supplierName: string;
  className?: string;
}

export default function PhotoGallery({
  photos,
  supplierName,
  className,
}: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const lastTileRef = useRef<HTMLButtonElement | null>(null);

  // Focus the lightbox when it opens so Escape / arrow keys work immediately,
  // and hand focus back to the tile that opened it on close.
  useEffect(() => {
    if (lightboxIndex !== null) {
      lightboxRef.current?.focus();
    } else {
      lastTileRef.current?.focus();
    }
  }, [lightboxIndex]);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = () =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null));
  const next = () =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") next(); // RTL: left = next
    if (e.key === "ArrowRight") prev(); // RTL: right = prev
  };

  if (photos.length === 0) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-border bg-white px-6 py-10 text-center", className)}>
        <p className="text-sm text-text-muted">אין תמונות עדיין</p>
      </div>
    );
  }

  return (
    <>
      {/* Masonry Grid */}
      <div
        className={cn("masonry-grid", className)}
      >
        {photos.map((photo, index) => (
          <button
            key={index}
            type="button"
            aria-label={`פתחו תמונה ${index + 1} מתוך ${photos.length}`}
            className="masonry-item block w-full cursor-pointer group relative overflow-hidden rounded-xl text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
            onClick={(e) => {
              lastTileRef.current = e.currentTarget;
              openLightbox(index);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt={`${supplierName} - תמונה ${index + 1}`}
              className="w-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"

            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-xl" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${supplierName} — גלריית תמונות`}
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center outline-none"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          {/* Close */}
          <button
            className="absolute top-4 end-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            onClick={closeLightbox}
            aria-label="סגירה"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium" dir="ltr">
            {lightboxIndex + 1} / {photos.length}
          </div>

          {/* Prev */}
          <button
            className="absolute end-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="הקודם"
          >
            <ChevronRight className="h-7 w-7" />
          </button>

          {/* Image */}
          <div
            className="relative max-w-[90vw] max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[lightboxIndex]}
              alt={`${supplierName} - תמונה ${lightboxIndex + 1}`}
              className="max-h-[85vh] w-auto object-contain rounded-lg"

            />
          </div>

          {/* Next */}
          <button
            className="absolute start-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="הבא"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
        </div>
      )}
    </>
  );
}
