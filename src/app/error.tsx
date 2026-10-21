"use client";

import { useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center space-y-4 bg-white rounded-3xl border border-border shadow-[var(--shadow-card)] p-8">
        <div className="text-5xl" aria-hidden="true">😕</div>
        <h1 className="text-2xl font-black text-text-main">משהו השתבש</h1>
        <p className="text-text-muted text-sm">נסו לרענן את הדף. אם הבעיה נמשכת, חזרו לדף הבית.</p>
        {error.digest && (
          <p className="text-xs text-text-muted" dir="ltr">
            קוד שגיאה: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button fullWidth onClick={reset}>
            נסו שוב
          </Button>
          <Link href="/" className="w-full">
            <Button variant="secondary" fullWidth>
              לדף הבית
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
