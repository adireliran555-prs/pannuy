"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-primary text-white hover:bg-primary-dark active:scale-95 shadow-sm hover:shadow-md",
      secondary:
        "bg-transparent text-primary border-2 border-primary hover:bg-primary-light active:scale-95",
      ghost:
        "bg-transparent text-text-main hover:bg-gray-100 active:scale-95",
      danger:
        "bg-red-500 text-white hover:bg-red-600 active:scale-95",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm h-9",
      md: "px-6 py-3 text-base h-11",
      lg: "px-8 py-4 text-lg h-14",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
