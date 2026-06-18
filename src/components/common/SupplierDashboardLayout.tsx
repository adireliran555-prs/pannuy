"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Calendar, BookOpen, BarChart3, User, LogOut, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/supplier/dashboard", label: "ראשי", icon: LayoutDashboard },
  { href: "/supplier/bookings", label: "פגישות", icon: BookOpen },
  { href: "/supplier/calendar", label: "לוח זמנים", icon: Calendar },
  { href: "/supplier/analytics", label: "אנליטיקה", icon: BarChart3 },
  { href: "/supplier/finances", label: "פיננסים", icon: DollarSign },
  { href: "/supplier/profile", label: "פרופיל", icon: User },
];

interface SupplierDashboardLayoutProps {
  children: React.ReactNode;
}

export default function SupplierDashboardLayout({
  children,
}: SupplierDashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [supplierInitial, setSupplierInitial] = useState("");

  useEffect(() => {
    fetch("/api/supplier/auth/me")
      .then((r) => r.json())
      .then((json) => {
        const name: string | undefined = json?.supplier?.name;
        if (name) setSupplierInitial(name.trim().charAt(0));
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/supplier/auth/logout", { method: "POST" });
    router.push("/supplier/login");
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden sm:block w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-border p-4 sticky top-24">
              <div className="mb-4 px-2 pb-3 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-black text-lg mb-2">
                  {supplierInitial || "ס"}
                </div>
                <h2 className="font-bold text-text-main text-base">פאנל הספקים</h2>
                <p className="text-text-muted text-xs">ניהול העסק שלכם</p>
              </div>
              <nav className="space-y-1">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary-light text-primary-dark"
                          : "text-text-muted hover:bg-gray-50 hover:text-text-main"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-text-muted hover:bg-red-50 hover:text-red-600 mt-2 border-t border-border pt-4"
                >
                  <LogOut className="h-4 w-4" />
                  התנתקות
                </button>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 pb-20 sm:pb-0">
            {children}
          </main>
        </div>
      </div>
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
        <div className="grid grid-cols-6 px-1 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "min-w-0 flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold transition-all",
                  isActive
                    ? "bg-primary-light text-primary-dark"
                    : "text-text-muted"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
