"use client";

import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface StarsProps {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export default function Stars({
  rating,
  count,
  size = "sm",
  interactive = false,
  onChange,
  className,
}: StarsProps) {
  const sizes = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.round(rating);
          return (
            <button
              key={star}
              type="button"
              onClick={() => interactive && onChange?.(star)}
              disabled={!interactive}
              className={cn(
                "transition-transform duration-100",
                interactive &&
                  "hover:scale-110 cursor-pointer disabled:cursor-default",
                !interactive && "cursor-default"
              )}
            >
              <Star
                className={cn(
                  sizes[size],
                  "transition-colors duration-100",
                  filled ? "star-filled" : "star-empty"
                )}
              />
            </button>
          );
        })}
      </div>
      <span className={cn("font-semibold text-text-main", textSizes[size])}>
        {rating.toFixed(1)}
      </span>
      {count !== undefined && (
        <span className={cn("text-text-muted", textSizes[size])}>
          ({count.toLocaleString("he-IL")})
        </span>
      )}
    </div>
  );
}
