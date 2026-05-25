import { Category } from "@prisma/client";

// ─── Session Payloads (stored in JWT) ────────────────────────────────────────

export interface CustomerSession {
  id: string;
  name: string;
  phone: string;
  weddingDate?: string | null;
  weddingArea?: string | null;
}

export interface SupplierSession {
  id: string;
  name: string;
  phone: string;
  category: Category;
  slug: string;
}

// ─── Generic API envelope ─────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Search / filter types ────────────────────────────────────────────────────

export interface SearchFilters {
  area?: string;
  date?: string; // ISO date string YYYY-MM-DD
  category?: Category;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  page?: number;
  limit?: number;
}

// ─── Availability types ───────────────────────────────────────────────────────

export interface TimeSlot {
  time: string; // "HH:mm"
  available: boolean;
}

export interface AvailabilityDay {
  date: string; // ISO date string YYYY-MM-DD
  slots: TimeSlot[];
}

// ─── Notification helper type ─────────────────────────────────────────────────

export type NotificationTarget =
  | { userId: string; supplierId?: never }
  | { supplierId: string; userId?: never };
