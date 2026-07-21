// Client-facing DTOs for the guided event-planning journey. These mirror the
// serialized shape returned by /api/events (see src/lib/event-service.ts).

import type { BudgetMode, Category, PlanItemStatus } from "@prisma/client";
import type { PlanSummary } from "@/lib/event-planning";

export interface PlanItemDTO {
  id: string;
  category: Category;
  status: PlanItemStatus;
  sortOrder: number;
  allocatedBudget: number | null;
  committedPrice: number | null;
  notes: string | null;
  selectedSupplier: {
    id: string;
    slug: string;
    name: string;
    city: string | null;
    category: Category;
    photoUrl: string | null;
  } | null;
  selectedPackage: {
    id: string;
    nameHe: string;
    price: number;
    hours: number | null;
  } | null;
}

export interface EventDTO {
  id: string;
  type: string;
  date: string | null;
  dateFlexible: boolean;
  areas: string[];
  city: string | null;
  guestCount: number | null;
  budgetMode: BudgetMode;
  budgetAmount: number | null;
  vibeTags: string[];
  kosher: boolean;
  status: string;
  createdAt: string;
}

export interface EventPayloadDTO {
  event: EventDTO;
  items: PlanItemDTO[];
  summary: PlanSummary;
}

export interface PickerPackageDTO {
  id: string;
  nameHe: string;
  descHe: string | null;
  price: number;
  hours: number | null;
  includes: string[];
  isPopular: boolean;
}

export interface PickerSupplierDTO {
  id: string;
  slug: string;
  name: string;
  category: Category;
  city: string | null;
  priceFrom: number | null;
  priceTo: number | null;
  rating: number;
  ratingCount: number;
  isVerified: boolean;
  profilePhoto: string | null;
  coverPhoto: string | null;
  isPreferred: boolean;
  withinBudget: boolean;
  packages: PickerPackageDTO[];
}

export interface CategoryPickerDTO {
  category: Category;
  allocatedBudget: number | null;
  areaFallback: boolean;
  venueName: string | null;
  suppliers: PickerSupplierDTO[];
}
