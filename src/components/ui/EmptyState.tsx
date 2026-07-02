import { cn } from "@/lib/utils";
import Button from "./Button";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

export default function EmptyState({
  emoji = "🔍",
  title,
  description,
  ctaLabel,
  onCta,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6 gap-4",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary text-3xl select-none">
        {emoji}
      </div>
      <h3 className="text-lg font-semibold text-text-main">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted max-w-xs leading-relaxed">{description}</p>
      )}
      {ctaLabel && onCta && (
        <Button onClick={onCta} className="mt-2">
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
