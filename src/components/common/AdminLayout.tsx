"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarCheck,
  Activity,
  Star,
  LogOut,
  Shield,
  Globe,
  Store,
  ExternalLink,
  Wallet,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/branding";

const NAV = [
  { href: "/admin", label: "סקירה כללית", icon: LayoutDashboard, exact: true },
  { href: "/admin/suppliers", label: "ספקים", icon: Briefcase },
  { href: "/admin/customers", label: "לקוחות", icon: Users },
  { href: "/admin/meetings", label: "פגישות", icon: CalendarCheck },
  { href: "/admin/referrals", label: "הפניות", icon: Target },
  { href: "/admin/reviews", label: "ביקורות", icon: Star },
  { href: "/admin/payouts", label: "משיכות", icon: Wallet },
  { href: "/admin/activity", label: "פעילות", icon: Activity },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-l border-border">
        <div className="px-6 py-5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-black text-text-main">פאנל ניהול</div>
            <div className="text-xs text-text-muted">{BRAND_NAME}</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                isActive(href, exact)
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:bg-surface hover:text-text-main"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}

          <div className="pt-4 mt-4 border-t border-border">
            <p className="px-3 mb-1 text-[10px] font-bold tracking-widest text-text-muted uppercase">פלטפורמות</p>
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-text-muted hover:bg-surface hover:text-text-main transition-colors"
            >
              <span className="flex items-center gap-3">
                <Globe className="h-4 w-4" />
                אתר ראשי (לקוחות)
              </span>
              <ExternalLink className="h-3 w-3 opacity-50" />
            </Link>
            <Link
              href="/supplier/login"
              target="_blank"
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-text-muted hover:bg-surface hover:text-text-main transition-colors"
            >
              <span className="flex items-center gap-3">
                <Store className="h-4 w-4" />
                פאנל ספקים
              </span>
              <ExternalLink className="h-3 w-3 opacity-50" />
            </Link>
            <p className="px-3 pt-2 text-[11px] text-text-muted/70 leading-relaxed">
              לכניסה כלקוח/ספק ספציפי, לחצו על &quot;צפו כ...&quot; בטבלאות.
            </p>
          </div>
        </nav>
        <button
          onClick={logout}
          className="mx-3 mb-4 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          יציאה
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm">פאנל ניהול</span>
          </div>
          <button onClick={logout} className="text-xs text-text-muted">
            יציאה
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 scrollbar-none">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors",
                isActive(href, exact)
                  ? "bg-primary text-white"
                  : "bg-surface text-text-muted hover:text-text-main"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Content */}
      <main className="flex-1 min-w-0 lg:py-8 lg:px-8 pt-28 px-4 pb-12">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
