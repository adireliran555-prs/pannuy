import Link from "next/link";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const SIZE_STYLES: Record<Size, { shared: string; rest: string }> = {
  sm: { shared: "text-2xl", rest: "text-sm" },
  md: { shared: "text-4xl", rest: "text-xl" },
  lg: { shared: "text-5xl", rest: "text-2xl" },
};

interface TopEventsLogoProps {
  href?: string;
  size?: Size;
  className?: string;
}

/**
 * Single shared T wordmark (LTR):
 *
 *     op      → Top
 * T           (shared)
 *     vents   → Events
 */
export default function TopEventsLogo({
  href,
  size = "md",
  className,
}: TopEventsLogoProps) {
  const { shared, rest } = SIZE_STYLES[size];

  const mark = (
    <span
      dir="ltr"
      className={cn(
        "inline-grid grid-cols-[auto_auto] grid-rows-[auto_auto_auto] items-center font-black leading-none tracking-tight select-none text-left gap-x-1",
        className
      )}
      aria-label="Top Events"
    >
      <span className={cn("col-start-2 row-start-1 text-text-main", rest)}>op</span>
      <span
        className={cn(
          "col-start-1 row-start-1 row-span-3 text-primary self-center pe-0.5",
          shared
        )}
      >
        T
      </span>
      <span className={cn("col-start-2 row-start-3 text-text-main", rest)}>vents</span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-85 transition-opacity inline-block">
        {mark}
      </Link>
    );
  }

  return mark;
}
