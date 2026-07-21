"use client";

interface ProgressRingProps {
  pct: number;
  size?: number;
  label?: string;
  sublabel?: string;
}

/** Circular progress indicator (SVG). pct is 0–100. */
export default function ProgressRing({
  pct,
  size = 128,
  label,
  sublabel,
}: ProgressRingProps) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-border)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-text-main leading-none">
          {label ?? `${clamped}%`}
        </span>
        {sublabel && (
          <span className="mt-1 text-xs text-text-muted">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
