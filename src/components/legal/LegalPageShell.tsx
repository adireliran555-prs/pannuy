import Link from "next/link";
import TopEventsLogo from "@/components/common/TopEventsLogo";
import { BRAND_NAME } from "@/lib/branding";

export default function LegalPageShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
          <TopEventsLogo href="/" size="sm" />
          <Link
            href="/"
            className="text-sm font-semibold text-primary hover:underline"
          >
            חזרה לדף הבית
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-black text-text-main mb-2">{title}</h1>
        <p className="text-sm text-text-muted mb-8">
          {BRAND_NAME} · עודכן לאחרונה: {updated}
        </p>
        <article className="prose-legal space-y-6 text-text-main leading-relaxed">
          {children}
        </article>
      </main>
    </div>
  );
}
