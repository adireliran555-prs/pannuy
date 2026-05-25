"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, BookOpen, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/supplier/dashboard", label: "דשבורד", icon: LayoutDashboard },
  { href: "/supplier/bookings", label: "הזמנות", icon: BookOpen },
  { href: "/supplier/calendar", label: "יומן", icon: Calendar },
  { href: "/supplier/analytics", label: "סטטיסטיקות", icon: BarChart3 },
  { href: "/supplier/profile", label: "פרופיל", icon: User },
];

interface SupplierDashboardLayoutProps {
  children: React.ReactNode;
}

export default function SupplierDashboardLayout({
  children,
}: SupplierDashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden sm:block w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-border p-4 sticky top-24">
              <div className="mb-4 px-2 pb-3 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-black text-lg mb-2">
                  צ
                </div>
                <h2 className="font-bold text-text-main text-base">פאנל הספקים</h2>
                <p className="text-text-muted text-xs">ניהול העסק שלך</p>
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
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 pb-20 sm:pb-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
