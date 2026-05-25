import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type BadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "default"
  | "primary"
  | "coming-soon";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

export default function Badge({
  variant = "default",
  size = "md",
  className,
  children,
  ...props
}: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    success: "bg-green-100 text-green-700 border border-green-200",
    warning: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    error: "bg-red-100 text-red-700 border border-red-200",
    info: "bg-blue-100 text-blue-700 border border-blue-200",
    default: "bg-gray-100 text-gray-600 border border-gray-200",
    primary: "bg-primary-light text-primary-dark border border-primary/30",
    "coming-soon": "bg-gray-800 text-white border border-gray-700",
  };

  const sizes = {
    sm: "text-xs px-2 py-0.5 rounded-full",
    md: "text-sm px-3 py-1 rounded-full",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
