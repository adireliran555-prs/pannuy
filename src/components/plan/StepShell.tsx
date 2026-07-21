"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import TopEventsLogo from "@/components/common/TopEventsLogo";

interface StepShellProps {
  stepIndex: number;
  stepCount: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isLoading?: boolean;
  canSkip?: boolean;
  onSkip?: () => void;
  children: ReactNode;
}

/** Full-screen frame for a single intake question: slim progress bar at
 *  the top, then the question card and its back/next actions grouped
 *  together and vertically centered in the remaining space. */
export default function StepShell({
  stepIndex,
  stepCount,
  title,
  subtitle,
  onBack,
  onNext,
  nextLabel,
  nextDisabled = false,
  isLoading = false,
  canSkip = false,
  onSkip,
  children,
}: StepShellProps) {
  const pct = ((stepIndex + 1) / stepCount) * 100;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      {/* Header: logo + slim progress bar (stays at the top) */}
      <div className="mb-6 shrink-0 space-y-3">
        <TopEventsLogo href="/" size="sm" />
        <div className="h-1.5 rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-text-muted">
          שלב {stepIndex + 1} מתוך {stepCount}
        </p>
      </div>

      {/* Question card + actions: one group, vertically centered in the
          remaining space. Grows past the viewport (page scrolls) on tall
          steps rather than clipping. */}
      <div className="flex flex-1 flex-col justify-center py-6">
        <Card padding="lg" className="space-y-5">
          <div className="space-y-1.5">
            <h1 className="text-xl font-black text-text-main sm:text-2xl">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-text-muted">{subtitle}</p>
            )}
          </div>
          <div>{children}</div>
        </Card>

        {/* Actions: stay attached to the card */}
        <div className="mt-6">
          <div className="flex items-center gap-3">
            {stepIndex > 0 && onBack && (
              <Button variant="ghost" onClick={onBack} disabled={isLoading}>
                חזרה
              </Button>
            )}
            <Button
              variant="primary"
              fullWidth
              onClick={onNext}
              disabled={nextDisabled}
              isLoading={isLoading}
            >
              {nextLabel ?? "המשך"}
            </Button>
          </div>
          {canSkip && onSkip && (
            <div className="mt-2 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                disabled={isLoading}
              >
                דלגו על השלב
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
