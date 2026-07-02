import Link from "next/link";
import TopEventsLogo from "@/components/common/TopEventsLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center bg-surface">
      <TopEventsLogo size="lg" href="/" />
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-text-main">הדף לא נמצא</h1>
        <p className="text-text-muted max-w-sm">
          הקישור שחיפשתם אינו קיים או הוסר. אפשר לחזור לחיפוש ספקים.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/search"
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-white shadow-[var(--shadow-card)] hover:bg-primary-dark transition-colors"
        >
          חפשו ספקים
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-primary/40 bg-white px-6 py-3 text-base font-semibold text-primary hover:bg-primary-light transition-colors"
        >
          לדף הבית
        </Link>
      </div>
    </div>
  );
}
