import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatHebrewDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
  }).format(d);
}

export function formatPhone(phone: string): string {
  // Format Israeli phone: 0501234567 -> 050-1234567
  if (phone.length === 10) {
    return `${phone.slice(0, 3)}-${phone.slice(3)}`;
  }
  return phone;
}

export function validateIsraeliPhone(phone: string): boolean {
  const cleaned = phone.replace(/[-\s]/g, "");
  return /^05\d{8}$/.test(cleaned);
}

export const ISRAELI_CITIES = [
  "תל אביב",
  "ירושלים",
  "חיפה",
  "באר שבע",
  "ראשון לציון",
  "פתח תקווה",
  "אשדוד",
  "נתניה",
  "הרצליה",
  "רמת גן",
  "גבעתיים",
  "רעננה",
  "כפר סבא",
  "מודיעין",
  "אילת",
  "אשקלון",
  "חולון",
  "בת ים",
  "בני ברק",
  "רחובות",
  "רמת השרון",
  "הוד השרון",
  "קריית גת",
  "לוד",
  "רמלה",
  "נהריה",
  "עכו",
  "טבריה",
  "צפת",
  "קריית שמונה",
];

export const HEBREW_DAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
export const HEBREW_MONTHS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  // Returns 0=Sunday which maps to our Hebrew calendar
  return new Date(year, month, 1).getDay();
}
