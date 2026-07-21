// Domain logic for the guided "plan an event with us" journey.
// Single source of truth for the category pyramid (booking order + budget
// allocation), the vibe/style tags, and all budget/progress math. Keep every
// planning-related constant here so UI, API, and analysis stay consistent.

import type { Category, BudgetMode } from "@prisma/client";

// ─── Vibe / style tags ──────────────────────────────────────────────────────

export const VIBE_TAGS = [
  { id: "classic", label: "קלאסי", emoji: "🤍" },
  { id: "luxury", label: "יוקרתי", emoji: "💎" },
  { id: "boho", label: "בוהו", emoji: "🌾" },
  { id: "nature", label: "טבע", emoji: "🌿" },
  { id: "modern", label: "מודרני", emoji: "🖤" },
  { id: "intimate", label: "צנוע", emoji: "🕊️" },
] as const;

export type VibeId = (typeof VIBE_TAGS)[number]["id"];

const VALID_VIBES = new Set<string>(VIBE_TAGS.map((v) => v.id));

export function isValidVibe(id: string): id is VibeId {
  return VALID_VIBES.has(id);
}

export function normalizeVibes(ids: string[] | undefined | null): VibeId[] {
  if (!ids?.length) return [];
  const seen = new Set<VibeId>();
  for (const id of ids) if (isValidVibe(id)) seen.add(id);
  return VIBE_TAGS.map((v) => v.id).filter((id) => seen.has(id));
}

export function vibeLabel(id: string): string {
  return VIBE_TAGS.find((v) => v.id === id)?.label ?? id;
}

// ─── The pyramid: category order + default budget allocation ──────────────────
// order = booking sequence (venue anchors everything). allocationPct = fraction
// of the total budget recommended for the category. perGuest = the category is
// naturally priced per plate (used for estimates/copy). essential = shown as a
// core step; non-essential categories are easy to mark "לא נחוץ".

export interface PyramidStep {
  category: Category;
  order: number;
  allocationPct: number;
  perGuest: boolean;
  essential: boolean;
  emoji: string;
  tagline: string;
}

export const PLAN_PYRAMID: PyramidStep[] = [
  {
    category: "VENUE" as Category,
    order: 1,
    allocationPct: 0.35,
    perGuest: true,
    essential: true,
    emoji: "🏛️",
    tagline: "הבסיס של האירוע — קובע תאריך, מיקום וסגנון",
  },
  {
    category: "CATERING" as Category,
    order: 2,
    allocationPct: 0.22,
    perGuest: true,
    essential: true,
    emoji: "🍽️",
    tagline: "האוכל שכולם יזכרו",
  },
  {
    category: "DJ" as Category,
    order: 3,
    allocationPct: 0.08,
    perGuest: false,
    essential: true,
    emoji: "🎧",
    tagline: "האנרגיה של הערב",
  },
  {
    category: "PHOTOGRAPHER" as Category,
    order: 4,
    allocationPct: 0.1,
    perGuest: false,
    essential: true,
    emoji: "📸",
    tagline: "הרגעים שיישארו לנצח",
  },
  {
    category: "VIDEOGRAPHER" as Category,
    order: 5,
    allocationPct: 0.07,
    perGuest: false,
    essential: false,
    emoji: "🎬",
    tagline: "הסרט של היום הגדול",
  },
  {
    category: "MAKEUP_ARTIST" as Category,
    order: 6,
    allocationPct: 0.03,
    perGuest: false,
    essential: false,
    emoji: "💄",
    tagline: "להיראות מושלמים",
  },
  {
    category: "HAIR_STYLIST" as Category,
    order: 7,
    allocationPct: 0.03,
    perGuest: false,
    essential: false,
    emoji: "💇",
    tagline: "התסרוקת המושלמת",
  },
  {
    category: "PHOTO_BOOTH" as Category,
    order: 8,
    allocationPct: 0.03,
    perGuest: false,
    essential: false,
    emoji: "🖼️",
    tagline: "כיף ומזכרת לאורחים",
  },
  {
    category: "EVENT_PRODUCER" as Category,
    order: 9,
    allocationPct: 0.05,
    perGuest: false,
    essential: false,
    emoji: "🎪",
    tagline: "מי שמנצח על כל התזמורת",
  },
];

// ~4% is intentionally left unallocated as a safety buffer.

export const PLAN_CATEGORIES: Category[] = PLAN_PYRAMID.map((s) => s.category);

const PYRAMID_BY_CATEGORY = new Map(PLAN_PYRAMID.map((s) => [s.category, s]));

export function getPyramidStep(category: string): PyramidStep | undefined {
  return PYRAMID_BY_CATEGORY.get(category as Category);
}

export function isPlanCategory(category: string): category is Category {
  return PYRAMID_BY_CATEGORY.has(category as Category);
}

// ─── Budget math ──────────────────────────────────────────────────────────────

export interface BudgetInput {
  budgetMode: BudgetMode;
  budgetAmount: number | null;
  guestCount: number | null;
}

/** Resolves the total event budget in ILS from the chosen mode. */
export function computeTotalBudget(event: BudgetInput): number {
  if (!event.budgetAmount || event.budgetAmount <= 0) return 0;
  if (event.budgetMode === "PER_GUEST") {
    return event.budgetAmount * Math.max(0, event.guestCount ?? 0);
  }
  return event.budgetAmount;
}

/** Recommended ILS allocation per category, derived from the total budget. */
export function allocateBudget(total: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const step of PLAN_PYRAMID) {
    out[step.category] = Math.round((total * step.allocationPct) / 100) * 100; // round to ₪100
  }
  return out;
}

export interface PlanItemLike {
  category: Category | string;
  status: string;
  committedPrice: number | null;
  allocatedBudget: number | null;
}

export interface PlanSummary {
  totalBudget: number;
  committed: number;
  remaining: number;
  allocatedForRemaining: number; // sum of allocations for not-yet-selected, still-needed items
  projectedTotal: number; // committed + allocatedForRemaining (rough forecast)
  selectedCount: number;
  actionableCount: number;
  skippedCount: number;
  notNeededCount: number;
  progressPct: number;
  overBudget: boolean;
}

/** Rolls up committed spend, remaining budget, and progress across plan items. */
export function computeSummary(total: number, items: PlanItemLike[]): PlanSummary {
  let committed = 0;
  let allocatedForRemaining = 0;
  let selected = 0;
  let skipped = 0;
  let notNeeded = 0;

  for (const item of items) {
    switch (item.status) {
      case "SELECTED":
        committed += item.committedPrice ?? 0;
        selected += 1;
        break;
      case "NOT_NEEDED":
        notNeeded += 1;
        break;
      case "SKIPPED":
        skipped += 1;
        allocatedForRemaining += item.allocatedBudget ?? 0;
        break;
      default: // PENDING / BROWSING
        allocatedForRemaining += item.allocatedBudget ?? 0;
    }
  }

  const actionable = items.length - notNeeded;

  return {
    totalBudget: total,
    committed,
    remaining: total - committed,
    allocatedForRemaining,
    projectedTotal: committed + allocatedForRemaining,
    selectedCount: selected,
    actionableCount: actionable,
    skippedCount: skipped,
    notNeededCount: notNeeded,
    progressPct: actionable > 0 ? Math.round((selected / actionable) * 100) : 0,
    overBudget: committed > total,
  };
}

/**
 * The price to commit for a chosen package. Package prices are stored as the
 * package total, so we commit them as-is. (Kept as a helper so per-guest
 * pricing rules can evolve in one place without touching call sites.)
 */
export function commitPriceForPackage(packagePrice: number): number {
  return Math.max(0, Math.round(packagePrice));
}

/** Formats ILS for display, e.g. 42000 -> "₪42,000". */
export function formatIls(amount: number): string {
  return `₪${Math.round(amount).toLocaleString("en-US")}`;
}
