"use client";

import type { PlanItemStatus } from "@prisma/client";
import { Check } from "lucide-react";
import Badge from "@/components/ui/Badge";

type BadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "default"
  | "primary"
  | "coming-soon";

interface StatusBadgeProps {
  status: PlanItemStatus;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<
  PlanItemStatus,
  { variant: BadgeVariant; label: string; withIcon?: boolean }
> = {
  SELECTED: { variant: "success", label: "נבחר", withIcon: true },
  SKIPPED: { variant: "warning", label: "דילגתם" },
  NOT_NEEDED: { variant: "default", label: "לא נחוץ" },
  BROWSING: { variant: "primary", label: "בעיון" },
  PENDING: { variant: "default", label: "טרם נבחר" },
};

/** Single source of truth for plan-item status color + label. */
export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge variant={cfg.variant} size={size}>
      {cfg.withIcon && <Check className="h-3 w-3" />}
      {cfg.label}
    </Badge>
  );
}
