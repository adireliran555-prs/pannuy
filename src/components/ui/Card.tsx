import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export default function Card({
  hover = false,
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-border shadow-sm",
        paddings[padding],
        hover &&
          "transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
