"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import Stars from "@/components/ui/Stars";
import { useState } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  PHOTOGRAPHER: "צילום חתונה",
  VIDEOGRAPHER: "צילום וידאו",
  BRIDAL_SUITE: "מקומות התארגנות",
  DJ: "DJ ומוסיקה",
  FLORIST: "עיצוב פרחוני",
  CATERING: "קייטרינג",
};

interface SupplierCardProps {
  id: string;
  slug: string;
  name: string;
  city: string;
  profilePhoto: string;
  coverPhoto?: string;
  rating: number;
  ratingCount: number;
  priceFrom: number;
  priceTo?: number;
  category: string;
  isAvailable?: boolean;
  isSaved?: boolean;
  onSave?: (id: string, saved: boolean) => void;
  className?: string;
}

export default function SupplierCard({
  id,
  slug,
  name,
  city,
  profilePhoto,
  coverPhoto,
  rating,
  ratingCount,
  priceFrom,
  priceTo,
  category,
  isAvailable,
  isSaved: initialSaved = false,
  onSave,
  className,
}: SupplierCardProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [heartAnimating, setHeartAnimating] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newSaved = !saved;
    setSaved(newSaved);
    setHeartAnimating(true);
    setTimeout(() => setHeartAnimating(false), 300);
    onSave?.(id, newSaved);
  };

  const photo = coverPhoto || profilePhoto;

  return (
    <Link
      href={`/suppliers/${slug}`}
      className={cn(
        "group block bg-white rounded-2xl overflow-hidden border border-border",
        "shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
        className
      )}
    >
      {/* Photo */}
      <div className="relative aspect-[3/2] overflow-hidden bg-primary-light">
        <Image
          src={photo}
          alt={`${name} - ${category}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Save button */}
        <button
          onClick={handleSave}
          aria-label={saved ? "הסר משמורות" : "שמרו"}
          className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-110 transition-transform duration-200"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-all duration-200",
              heartAnimating && "heart-pop",
              saved ? "fill-red-500 stroke-red-500" : "stroke-gray-600"
            )}
          />
        </button>

        {/* Badges top-right */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
          {rating >= 4.8 && ratingCount >= 10 && (
            <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
              ⭐ מומלץ
            </span>
          )}
          {isAvailable !== undefined && (
            isAvailable ? (
              <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                <CheckCircle className="h-3 w-3" />
                פנוי
              </span>
            ) : (
              <span className="inline-flex items-center bg-gray-800/80 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                לא פנוי
              </span>
            )
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Name + City */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-text-main text-base leading-tight">
            {name}
          </h3>
          <span className="text-xs font-medium bg-primary-light text-primary-dark px-2 py-0.5 rounded-full whitespace-nowrap">
            {CATEGORY_LABELS[category] ?? category}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-text-muted text-sm">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{city}</span>
        </div>

        {/* Rating */}
        <Stars rating={rating} count={ratingCount} size="sm" />

        {/* Price */}
        <div className="pt-1 border-t border-border/50">
          <span className="text-sm text-text-muted">החל מ־</span>
          <span className="font-bold text-text-main">
            {" "}{formatPrice(priceFrom)}
          </span>
          {priceTo && (
            <span className="text-text-muted text-sm">
              {" "}עד {formatPrice(priceTo)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
