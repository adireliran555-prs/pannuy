import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/branding";

type Size = "sm" | "md" | "lg";

const SIZE_STYLES: Record<Size, string> = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl",
};

interface TopEventsLogoProps {
  href?: string;
  size?: Size;
  className?: string;
  /** Render on a dark background (footer): all text/dot become light. */
  onDark?: boolean;
}

export default function TopEventsLogo({
  href,
  size = "md",
  className,
  onDark = false,
}: TopEventsLogoProps) {
  const mark = (
    <span
      dir="ltr"
      className={cn(
        "inline-flex items-center font-black tracking-tight leading-none select-none whitespace-nowrap",
        SIZE_STYLES[size],
        className
      )}
      aria-label={BRAND_NAME}
    >
      <span className={onDark ? "text-white" : "text-primary"}>Top</span>
      <span
        aria-hidden
        className={cn(
          "mx-[0.15em] inline-block h-[0.2em] w-[0.2em] shrink-0 rounded-full align-middle",
          onDark ? "bg-white" : "bg-primary"
        )}
      />
      <span className={onDark ? "text-white/95" : "text-text-main"}>Eventer</span>
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
