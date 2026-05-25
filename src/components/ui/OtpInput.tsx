"use client";

import { cn } from "@/lib/utils";
import { useRef, KeyboardEvent, ClipboardEvent } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
}

export default function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  error,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split("").slice(0, length);
  while (digits.length < length) digits.push("");

  const focusIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(length - 1, index));
    inputRefs.current[clamped]?.focus();
  };

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return;
    const newDigits = [...digits];
    newDigits[index] = char.slice(-1);
    const newValue = newDigits.join("");
    onChange(newValue);
    if (char && index < length - 1) {
      focusIndex(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join(""));
      } else if (index > 0) {
        focusIndex(index - 1);
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
      }
    } else if (e.key === "ArrowRight") {
      focusIndex(index - 1); // RTL: right goes to previous
    } else if (e.key === "ArrowLeft") {
      focusIndex(index + 1); // RTL: left goes to next
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted.padEnd(length, "").slice(0, length).replace(/\s/g, ""));
    if (pasted.length > 0) {
      focusIndex(Math.min(pasted.length, length - 1));
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex gap-2 sm:gap-3"
        dir="ltr" // OTP always LTR
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digit}
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={cn(
              "w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border-2",
              "transition-all duration-200 outline-none",
              "bg-white text-text-main",
              digit
                ? "border-primary bg-primary-light/30"
                : "border-border hover:border-primary/50",
              "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:scale-105",
              error && "border-red-400",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}
