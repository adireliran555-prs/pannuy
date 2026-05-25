import Stars from "@/components/ui/Stars";
import { cn } from "@/lib/utils";

interface ReviewCardProps {
  reviewerName: string;
  date: string;
  rating: number;
  text: string;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

const avatarColors = [
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
];

function getColorForName(name: string): string {
  const index =
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    avatarColors.length;
  return avatarColors[index];
}

export default function ReviewCard({
  reviewerName,
  date,
  rating,
  text,
  className,
}: ReviewCardProps) {
  const initials = getInitials(reviewerName);
  const colorClass = getColorForName(reviewerName);

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-border p-5 space-y-3",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
            colorClass
          )}
        >
          {initials}
        </div>

        {/* Meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-text-main">{reviewerName}</span>
            <span className="text-xs text-text-muted flex-shrink-0">{date}</span>
          </div>
          <Stars rating={rating} size="sm" className="mt-0.5" />
        </div>
      </div>

      <p className="text-text-muted text-sm leading-relaxed">{text}</p>
    </div>
  );
}
