import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  label: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number; // 1-based
  className?: string;
}

export default function StepProgress({
  steps,
  currentStep,
  className,
}: StepProgressProps) {
  return (
    <ol className={cn("flex items-start gap-0 list-none p-0 m-0", className)}>
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        const isUpcoming = stepNum > currentStep;

        return (
          <li
            key={index}
            aria-current={isActive ? "step" : undefined}
            className="flex items-center flex-1 last:flex-none min-w-0"
          >
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                  isDone &&
                    "bg-primary text-white",
                  isActive &&
                    "bg-primary text-white ring-4 ring-primary/20 scale-110",
                  isUpcoming && "bg-gray-100 text-text-muted border-2 border-border"
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              <span
                className={cn(
                  "text-xs font-medium text-center leading-tight max-w-[4.5rem] sm:max-w-none",
                  isActive && "text-primary",
                  isUpcoming && "text-text-muted",
                  isDone && "text-primary"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line — between steps, not after last */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 mt-4 self-start transition-all duration-300",
                  isDone ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
