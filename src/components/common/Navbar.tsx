"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, Heart, Calendar, User, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import TopEventsLogo from "@/components/common/TopEventsLogo";

const MOBILE_NAV = [
  { href: "/search", label: "גלו", icon: Search },
  { href: "/dashboard/saved", label: "שמורים", icon: Heart },
  { href: "/dashboard/meetings", label: "פגישות", icon: Calendar },
  { href: "/dashboard/profile", label: "פרופיל", icon: User },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json) => setIsLoggedIn(json.success === true))
      .catch(() => {});
  }, []);

  const isOnboarding =
    pathname.startsWith("/start") || pathname.startsWith("/supplier/join");

  if (isOnboarding) return null;

  return (
    <>
      {/* Desktop Top Navbar */}
      <header className="hidden sm:block sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo — right side in RTL */}
          <div className="flex items-center gap-8">
            <TopEventsLogo href="/" size="md" />
            <nav className="flex items-center gap-6">
              <Link
                href="/search"
                className={cn(
                  "text-sm font-semibold transition-colors",
                  pathname === "/search"
                    ? "text-primary"
                    : "text-text-muted hover:text-text-main"
                )}
              >
                גלו ספקים
              </Link>
            </nav>
          </div>

          {/* Auth buttons — left side in RTL */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard/meetings">
                <Button size="sm" variant="secondary">
                  הפגישות שלי
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => { window.location.href = "/start"; }}
                >
                  כניסה
                </Button>
                <Button
                  size="sm"
                  onClick={() => { window.location.href = "/start"; }}
                >
                  הרשמה חינם
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navbar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 px-4 transition-colors min-w-0",
                  isActive ? "text-primary" : "text-text-muted"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-primary")} />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Supplier mobile nav */}
    </>
  );
}

export function SupplierNavbar() {
  const pathname = usePathname();

  const SUPPLIER_MOBILE_NAV = [
    { href: "/supplier/dashboard", label: "בית", icon: Camera },
    { href: "/supplier/bookings", label: "הזמנות", icon: Calendar },
    { href: "/supplier/calendar", label: "יומן", icon: Calendar },
    { href: "/supplier/profile", label: "פרופיל", icon: User },
  ];

  return (
    <>
      {/* Desktop Supplier Top Navbar */}
      <header className="hidden sm:block sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <TopEventsLogo href="/supplier/dashboard" size="md" />
            <nav className="flex items-center gap-6">
              {[
                { href: "/supplier/dashboard", label: "דשבורד" },
                { href: "/supplier/bookings", label: "הזמנות" },
                { href: "/supplier/calendar", label: "יומן" },
                { href: "/supplier/analytics", label: "סטטיסטיקות" },
                { href: "/supplier/profile", label: "פרופיל" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "text-sm font-semibold transition-colors",
                    pathname === href
                      ? "text-primary"
                      : "text-text-muted hover:text-text-main"
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="text-sm font-semibold text-text-muted">
            פאנל ספקים
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navbar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border">
        <div className="flex items-center justify-around h-16">
          {SUPPLIER_MOBILE_NAV.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 px-4 transition-colors",
                  isActive ? "text-primary" : "text-text-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
