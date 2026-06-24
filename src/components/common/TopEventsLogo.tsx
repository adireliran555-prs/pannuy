import Link from "next/link";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const SIZE_STYLES: Record<
  Size,
  { shared: string; side: string; op: string; gap: string }
> = {
  sm: { shared: "text-[1.75rem]", side: "text-[0.65rem]", op: "text-[0.65rem]", gap: "gap-x-0" },
  md: { shared: "text-[2.75rem]", side: "text-base", op: "text-sm", gap: "gap-x-0.5" },
  lg: { shared: "text-[3.5rem]", side: "text-xl", op: "text-lg", gap: "gap-x-1" },
};

interface TopEventsLogoProps {
  href?: string;
  size?: Size;
  className?: string;
}

/**
 * Shared-T wordmark (always LTR):
 *
 *       op          ← "Top"
 *   Even T s        ← "Events" (the big T is the crossbar letter)
 */
export default function TopEventsLogo({
  href,
  size = "md",
  className,
}: TopEventsLogoProps) {
  const { shared, side, op, gap } = SIZE_STYLES[size];

  const mark = (
    <span
      dir="ltr"
      className={cn(
        "inline-grid font-black leading-none tracking-tight select-none text-left",
        "grid-cols-[auto_auto_auto] grid-rows-[auto_auto]",
        gap,
        className
      )}
      aria-label="Top Events"
    >
      {/* Top → shared T + op */}
      <span
        className={cn(
          "col-start-2 row-start-1 justify-self-center text-text-main -mb-1",
          op
        )}
      >
        op
      </span>

      {/* Events → Even + shared T + s */}
      <span
        className={cn(
          "col-start-1 row-start-2 self-end text-text-main",
          side
        )}
      >
        Even
      </span>
      <span
        className={cn(
          "col-start-2 row-start-2 text-primary justify-self-center -mt-2",
          shared
        )}
        aria-hidden
      >
        T
      </span>
      <span
        className={cn(
          "col-start-3 row-start-2 self-end text-text-main",
          side
        )}
      >
        s
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
