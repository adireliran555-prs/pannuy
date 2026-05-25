"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Heart, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard/meetings", label: "הפגישות שלי", icon: Calendar },
  { href: "/dashboard/saved", label: "שמורות", icon: Heart },
  { href: "/dashboard/profile", label: "הפרופיל שלי", icon: User },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex gap-8">
          {/* Sidebar — desktop only */}
          <aside className="hidden sm:block w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-border p-4 sticky top-24">
              <div className="mb-4 px-2">
                <h2 className="font-bold text-text-main text-lg">האזור שלי</h2>
                <p className="text-text-muted text-sm">נהלו את החתונה שלכם</p>
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
