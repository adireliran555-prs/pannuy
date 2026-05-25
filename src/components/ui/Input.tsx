"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  ltr?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, ltr = false, className, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-text-main"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          dir={ltr ? "ltr" : undefined}
          className={cn(
            "w-full rounded-xl border px-4 py-3 text-base transition-all duration-200",
            "bg-white text-text-main placeholder:text-text-muted",
            "border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50",
            error && "border-red-400 focus:border-red-400 focus:ring-red-200",
            ltr && "text-left",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500 font-medium">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
