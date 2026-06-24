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
}

export default function TopEventsLogo({
  href,
  size = "md",
  className,
}: TopEventsLogoProps) {
  const mark = (
    <span
      dir="ltr"
      className={cn(
        "inline-flex items-baseline font-black tracking-tight leading-none select-none whitespace-nowrap",
        SIZE_STYLES[size],
        className
      )}
      aria-label={BRAND_NAME}
    >
      <span className="text-primary">Top</span>
      <span className="text-text-main"> Eventer</span>
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
