"use client";

import { VIBE_TAGS } from "@/lib/event-planning";
import { cn } from "@/lib/utils";

interface VibeChipsProps {
  value: string[];
  onChange: (value: string[]) => void;
}

/** Multi-select pill chips for the event vibe/style. */
export default function VibeChips({ value, onChange }: VibeChipsProps) {
  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {VIBE_TAGS.map((tag) => {
        const selected = value.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={cn(
              "rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors duration-200",
              selected
                ? "border-primary bg-primary text-white"
                : "border-border bg-white text-text-main hover:border-primary/40"
            )}
          >
            <span className="me-1">{tag.emoji}</span>
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
