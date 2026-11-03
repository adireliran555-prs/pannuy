// Single source of truth for platform commission rates.
// Rates are per supplier category ("product type"); all 7% for now.
import type { Category } from "@prisma/client";

export const DEFAULT_COMMISSION_RATE = 0.07;

export const COMMISSION_RATE_BY_CATEGORY: Record<Category, number> = {
  PHOTOGRAPHER: 0.07,
  VIDEOGRAPHER: 0.07,
  DJ: 0.07,
  CATERING: 0.07,
  VENUE: 0.07,
  HAIR_STYLIST: 0.07,
  MAKEUP_ARTIST: 0.07,
  PHOTO_BOOTH: 0.07,
  EVENT_PRODUCER: 0.07,
  BRIDAL_SUITE: 0.07,
  FLORIST: 0.07,
};

// Agent (סוכן) referral commission — share of the deal value, paid out of the
// platform commission. PLACEHOLDER until Adir confirms the rate.
export const AGENT_REFERRAL_RATE = 0.02;

// Contractual penalties (must match the supplier agreement).
export const CIRCUMVENTION_PENALTY_ILS = 40_000;
export const LATE_PAYMENT_MONTHLY_INTEREST = 0.015;
export const CIRCUMVENTION_PRESUMPTION_MONTHS = 24;
export const DEAL_REPORT_DAYS = 7;
export const COMMISSION_PAYMENT_DAYS = 14;

export function commissionRateFor(category: Category | string): number {
  return COMMISSION_RATE_BY_CATEGORY[category as Category] ?? DEFAULT_COMMISSION_RATE;
}

export function computeCommissionIls(category: Category | string, dealAmountIls: number): number {
  if (!Number.isFinite(dealAmountIls) || dealAmountIls <= 0) return 0;
  return Math.round(dealAmountIls * commissionRateFor(category));
}

export function computeAgentCommissionIls(dealAmountIls: number): number {
  if (!Number.isFinite(dealAmountIls) || dealAmountIls <= 0) return 0;
  return Math.round(dealAmountIls * AGENT_REFERRAL_RATE);
}

export function formatRate(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`;
}
