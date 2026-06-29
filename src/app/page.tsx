export const revalidate = 60;

import Link from "next/link";
import { Camera, CheckCircle, ShieldCheck, Search, Calendar, ArrowLeft } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import SupplierCard from "@/components/common/SupplierCard";
import HeroSearch from "@/components/common/HeroSearch";
import { CATEGORY_LABELS } from "@/lib/categories";
import prisma from "@/lib/prisma";
import TopEventsLogo from "@/components/common/TopEventsLogo";
import { BRAND_NAME } from "@/lib/branding";

export default async function HomePage() {
  const [rawSuppliers, supplierCount] = await Promise.all([
    prisma.supplier.findMany({
      where: { isActive: true },
      take: 6,
      orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
      select: {
        id: true, slug: true, name: true, city: true, category: true, isVerified: true,
        basePriceFrom: true, basePriceTo: true,
        photos: { where: { type: { in: ["PROFILE", "COVER"] } }, orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.supplier.count({ where: { isActive: true } }),
  ]);

  const featuredSuppliers = rawSuppliers.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    city: s.city ?? "",
    category: s.category,
    isVerified: s.isVerified,
    priceFrom: s.basePriceFrom ?? 0,
    priceTo: s.basePriceTo ?? undefined,
    profilePhoto:
      s.photos.find((p) => p.type === "PROFILE")?.cloudinaryUrl ??
      s.photos.find((p) => p.type === "PORTFOLIO")?.cloudinaryUrl ??
      "/placeholder-supplier.svg",
    coverPhoto: s.photos.find((p) => p.type === "COVER")?.cloudinaryUrl,
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-amber-50 to-primary-light" />

        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 rounded-full bg-rose-200/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-100/20 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <div className="mb-6 flex justify-center">
            <TopEventsLogo size="lg" className="scale-125 sm:scale-150" />
          </div>

          {/* Main tagline */}
          <h1 className="text-2xl sm:text-4xl font-bold text-text-main leading-tight mb-4">
            מצאו את הספקים המושלמים
            <br />
            <span className="text-primary">לאירוע שלכם</span>
          </h1>

          {/* Sub-tagline */}
          <p className="text-base sm:text-lg text-text-muted mb-8 max-w-xl mx-auto">
            בדיקת זמינות בזמן אמת&nbsp;·&nbsp;קביעת פגישה ישירות&nbsp;·&nbsp;ספקים מאומתים
          </p>

          {/* Quick search */}
          <HeroSearch />

          <p className="mt-6 text-sm text-text-muted">
            כבר רשומים?{" "}
            <Link href="/start" className="text-primary font-semibold underline underline-offset-2">
              התחברו
            </Link>
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-text-muted">
          <span className="text-xs font-medium">גללו למטה</span>
          <div className="w-6 h-10 rounded-full border-2 border-text-muted/30 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-text-muted/50 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sm font-bold text-primary uppercase tracking-widest">
              איך זה עובד
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-text-main mt-2">
              שלושה צעדים פשוטים
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: Calendar,
                title: "בחרו תאריך ואזור",
                desc: "ספרו לנו מתי ואיפה האירוע שלכם, ואנחנו נמצא את הספקים שפנויים עבורכם",
                color: "bg-rose-100 text-rose-600",
              },
              {
                step: "2",
                icon: Search,
                title: "גלו ספקים פנויים",
                desc: "עיינו בפרופילים, תיקי עבודות, חבילות ומחירים — הכל במקום אחד",
                color: "bg-amber-100 text-amber-600",
              },
              {
                step: "3",
                icon: CheckCircle,
                title: "קבעו פגישה",
                desc: "בחרו זמן נוח ותאמו פגישת היכרות ישירות — ללא אימיילים, ללא הפתעות",
                color: "bg-emerald-100 text-emerald-600",
              },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div
                key={step}
                className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl hover:bg-surface transition-colors"
              >
                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center`}>
                  <Icon className="h-7 w-7" />
                </div>
                <div className="text-xs font-black text-text-muted uppercase tracking-widest">
                  שלב {step}
                </div>
                <h3 className="text-lg font-bold text-text-main">{title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CATEGORIES
      ══════════════════════════════════════ */}
      <section className="py-16 px-6 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-text-main">
              גלו לפי קטגוריה
            </h2>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-4 snap-x snap-mandatory">
            {[
              {
                title: CATEGORY_LABELS.PHOTOGRAPHER,
                emoji: "📸",
                href: "/search?category=PHOTOGRAPHER",
                active: true,
                bg: "bg-gradient-to-br from-rose-100 to-rose-200",
              },
              {
                title: CATEGORY_LABELS.VENUE,
                emoji: "🏛️",
                href: `https://wa.me/972555173402?text=${encodeURIComponent(`היי, תעדכנו אותי כש${CATEGORY_LABELS.VENUE} יהיו זמינים ב-${BRAND_NAME} 🙏`)}`,
                active: false,
                bg: "bg-gradient-to-br from-purple-100 to-purple-200",
              },
              {
                title: CATEGORY_LABELS.MAKEUP_ARTIST,
                emoji: "💄",
                href: `https://wa.me/972555173402?text=${encodeURIComponent(`היי, תעדכנו אותי כש${CATEGORY_LABELS.MAKEUP_ARTIST} יהיו זמינות ב-${BRAND_NAME} 🙏`)}`,
                active: false,
                bg: "bg-gradient-to-br from-pink-100 to-pink-200",
              },
              {
                title: CATEGORY_LABELS.CATERING,
                emoji: "🍽️",
                href: `https://wa.me/972555173402?text=${encodeURIComponent(`היי, תעדכנו אותי כש${CATEGORY_LABELS.CATERING} יהיה זמין ב-${BRAND_NAME} 🙏`)}`,
                active: false,
                bg: "bg-gradient-to-br from-amber-100 to-amber-200",
              },
            ].map(({ title, emoji, href, active, bg }) => (
              <Link
                key={title}
                href={href}
                target={active ? undefined : "_blank"}
                className={`flex-shrink-0 w-48 sm:w-auto snap-start rounded-2xl ${bg} p-6 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer`}
              >
                <span className="text-4xl">{emoji}</span>
                <h3 className="font-bold text-text-main">{title}</h3>
                {active ? (
                  <span className="text-xs font-semibold text-primary">
                    גלו עכשיו →
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-gray-800 text-white px-2.5 py-0.5 rounded-full w-fit">
                    עדכנו אותי →
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURED SUPPLIERS
      ══════════════════════════════════════ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-sm font-bold text-primary uppercase tracking-widest">
                מומלצות
              </span>
              <h2 className="text-3xl font-black text-text-main mt-1">
                הספקים שלנו
              </h2>
            </div>
            <Link
              href="/search"
              className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
            >
              ראו הכל
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSuppliers.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                {...supplier}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════ */}
      <section className="py-16 px-6 bg-primary">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-white">
            {[
              { value: `${supplierCount}`, label: "ספקים מהטופ של ישראל", icon: Camera },
              { value: "100%", label: "ספקים מאומתים", icon: ShieldCheck },
              { value: "בזמן אמת", label: "זמינות אמיתית", icon: CheckCircle },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <Icon className="h-8 w-8 text-white/70" />
                <div className="text-4xl font-black">{value}</div>
                <div className="text-white/80 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="bg-text-main text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-10">
            <div className="sm:col-span-2">
              <TopEventsLogo size="md" className="mb-2 [&_span]:text-white [&_span.text-primary]:text-primary" />
              <p className="text-white/60 text-sm leading-relaxed max-w-xs">
                הפלטפורמה המובילה לחיפוש ספקי אירועים בישראל. מחברים בין לקוחות לספקים המושלמים עבורם.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-sm text-white/80 uppercase tracking-widest">
                ללקוחות
              </h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link href="/search" className="hover:text-white transition-colors">חפשו ספקים</Link></li>
                <li><Link href="/dashboard/meetings" className="hover:text-white transition-colors">הפגישות שלי</Link></li>
                <li><Link href="/dashboard/saved" className="hover:text-white transition-colors">שמורות</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-sm text-white/80 uppercase tracking-widest">
                לספקים
              </h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link href="/for-suppliers" className="hover:text-white transition-colors">הצטרפו ל-{BRAND_NAME}</Link></li>
                <li><Link href="/supplier/dashboard" className="hover:text-white transition-colors">פאנל ספקים</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white/40">
            <span>© {new Date().getFullYear()} {BRAND_NAME}. כל הזכויות שמורות.</span>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-white/70 transition-colors">פרטיות</Link>
              <Link href="/terms" className="hover:text-white/70 transition-colors">תנאי שימוש</Link>
              <Link href="/contact" className="hover:text-white/70 transition-colors">יצירת קשר</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
