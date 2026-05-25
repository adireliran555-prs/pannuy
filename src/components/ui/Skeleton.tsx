import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton-shimmer rounded-lg",
        className
      )}
    />
  );
}

export function SupplierCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-border">
      <Skeleton className="aspect-[3/2] w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="flex gap-4 px-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}
