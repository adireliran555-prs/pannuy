import Link from "next/link";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const SIZE_STYLES: Record<Size, { t: string; line: string }> = {
  sm: { t: "text-[1.35rem]", line: "text-sm" },
  md: { t: "text-[2rem]", line: "text-xl" },
  lg: { t: "text-[2.5rem]", line: "text-2xl" },
};

interface TopEventsLogoProps {
  href?: string;
  size?: Size;
  className?: string;
}

/**
 * LTR wordmark: shared T for Top / Events. Always `dir=ltr` so RTL pages don't flip it.
 */
export default function TopEventsLogo({
  href,
  size = "md",
  className,
}: TopEventsLogoProps) {
  const { t, line } = SIZE_STYLES[size];

  const mark = (
    <span
      dir="ltr"
      className={cn(
        "inline-grid grid-cols-[auto_1fr] grid-rows-2 gap-x-0.5 font-black leading-[0.9] tracking-tight select-none text-left",
        className
      )}
      aria-label="Top Events"
    >
      <span
        className={cn("text-primary row-span-2 self-center pe-0.5", t)}
        aria-hidden
      >
        T
      </span>
      <span className={cn("text-text-main", line)}>op</span>
      <span className={cn("text-text-main -mt-0.5", line)}>Events</span>
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
