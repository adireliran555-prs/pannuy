import Link from "next/link";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const SIZE_STYLES: Record<Size, { t: string; rest: string }> = {
  sm: { t: "text-xl", rest: "text-base" },
  md: { t: "text-3xl", rest: "text-2xl" },
  lg: { t: "text-4xl", rest: "text-3xl" },
};

interface TopEventsLogoProps {
  href?: string;
  size?: Size;
  className?: string;
}

/**
 * Wordmark where a single “T” serves both lines — Top / Events.
 */
export default function TopEventsLogo({
  href,
  size = "md",
  className,
}: TopEventsLogoProps) {
  const { t, rest } = SIZE_STYLES[size];

  const mark = (
    <span
      className={cn(
        "inline-flex items-stretch font-black leading-none tracking-tight select-none",
        className
      )}
      aria-label="Top Events"
    >
      <span className={cn("text-primary self-center pe-px", t)}>T</span>
      <span className={cn("flex flex-col justify-center text-text-main", rest)}>
        <span>op</span>
        <span className="-mt-0.5">Events</span>
      </span>
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
