"use client";

import { useState } from "react";
import Image from "next/image";
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

  return (
    <>
      {/* Masonry Grid */}
      <div
        className={cn("masonry-grid", className)}
      >
        {photos.map((photo, index) => (
          <div
            key={index}
            className="masonry-item cursor-pointer group relative overflow-hidden rounded-xl"
            onClick={() => openLightbox(index)}
          >
            <Image
              src={photo}
              alt={`${supplierName} - תמונה ${index + 1}`}
              width={400}
              height={300}
              className="w-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            onClick={closeLightbox}
            aria-label="סגור"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium" dir="ltr">
            {lightboxIndex + 1} / {photos.length}
          </div>

          {/* Prev */}
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
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
            <Image
              src={photos[lightboxIndex]}
              alt={`${supplierName} - תמונה ${lightboxIndex + 1}`}
              width={1200}
              height={800}
              className="max-h-[85vh] w-auto object-contain rounded-lg"
              unoptimized
            />
          </div>

          {/* Next */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
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
