"use client";

import { Check } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface PackageCardProps {
  name: string;
  price: number;
  hours: number;
  includes: string[];
  isPopular?: boolean;
  onSelect?: () => void;
  className?: string;
}

export default function PackageCard({
  name,
  price,
  hours,
  includes,
  isPopular,
  onSelect,
  className,
}: PackageCardProps) {
  return (
    <div
      className={cn(
        "relative bg-white rounded-2xl border-2 p-6 transition-all duration-200",
        isPopular
          ? "border-primary shadow-lg shadow-primary/10"
          : "border-border hover:border-primary/30",
        className
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 right-1/2 translate-x-1/2">
          <Badge variant="primary" className="shadow-sm">
            ✨ הכי פופולרי
          </Badge>
        </div>
      )}

      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="font-bold text-text-main text-lg">{name}</h3>
          <p className="text-text-muted text-sm mt-0.5">{hours} שעות</p>
        </div>

        {/* Price */}
        <div>
          <span className="text-3xl font-black text-primary">
            {formatPrice(price)}
          </span>
        </div>

        {/* Includes */}
        <ul className="space-y-2">
          {includes.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-text-main">{item}</span>
            </li>
          ))}
        </ul>

        {onSelect && (
          <Button
            onClick={onSelect}
            fullWidth
            variant={isPopular ? "primary" : "secondary"}
            className="mt-2"
          >
            בחרו חבילה
          </Button>
        )}
      </div>
    </div>
  );
}
