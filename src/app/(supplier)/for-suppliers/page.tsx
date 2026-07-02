import type { Metadata } from "next";
import Link from "next/link";
import { Camera, Calendar, TrendingUp, CheckCircle, ChevronLeft, Users, Gift, ShieldCheck } from "lucide-react";
import TopEventsLogo from "@/components/common/TopEventsLogo";
import { BRAND_NAME } from "@/lib/branding";

export const metadata: Metadata = {
  title: "הצטרפו כספקים",
  description: `הצטרפות חינם, לידים איכותיים ולוח שנה חכם. ${BRAND_NAME} לספקי אירועים בישראל.`,
  alternates: { canonical: "/for-suppliers" },
};

const FAQS = [
  {
    q: `האם ההצטרפות ל-${BRAND_NAME} כרוכה בתשלום?`,
    a: `לא! ההצטרפות ל-${BRAND_NAME} חינמית לחלוטין. אין תשלום חודשי ואין עמלת רישום. אנחנו גובים עמלה רק על עבודות שאתם סוגרים בפועל דרך הפלטפורמה — אם לא סגרתם, לא שילמתם.`,
  },
  {
    q: "אפשר להרוויח על הפניה של ספקים נוספים?",
    a: "בהחלט. כשאתם מפנים אלינו ספקים נוספים, אתם מרוויחים עמלה על העבודות שהם סוגרים. ככל שהקהילה גדלה, כך גדלה ההכנסה שלכם.",
  },
  {
    q: "כמה זמן לוקח להקים פרופיל?",
    a: "פחות מ-15 דקות. תמלאו פרטים בסיסיים, תעלו תמונות מתיק העבודות שלכם, ותגדירו חבילות ומחירים. נבצע אימות קצר ותהיו פעילים!",
  },
  {
    q: "איך מנהלים את הזמינות?",
    a: `ניתן לסנכרן אוטומטית עם Google Calendar שלכם, או לנהל ידנית ישירות בפלטפורמה. כשיש לכם אירוע ביומן, ${BRAND_NAME} תסמן את היום כחסום אוטומטית.`,
  },
  {
    q: "מה קורה כשזוג מבקש פגישה?",
    a: "תקבלו התראה מיידית, תוכלו לאשר או לדחות תוך שניות, ותתקשרו עם הזוג ישירות דרך הפלטפורמה. ללא מתווכים.",
  },
];

export default function ForSuppliersPage() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1519741497674-611481863552?w=1600')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-gray-900/30" />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <span className="inline-block bg-primary/20 border border-primary/40 text-primary font-bold text-sm px-4 py-1.5 rounded-full mb-6">
            לספקי אירועים
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-4">
            הציגו את האמנות שלכם
            <br />
            <span className="text-primary">לאלפי זוגות</span>
          </h1>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto leading-relaxed">
            הצטרפו ל-{BRAND_NAME} — הפלטפורמה לספקי החתונות מהטופ של ישראל. קבלו לידים איכותיים ונהלו פגישות בקלות.
          </p>
          <Link
            href="/supplier/join"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold text-lg px-10 py-5 rounded-full shadow-2xl hover:shadow-primary/30 hover:bg-primary-dark transition-all duration-200 hover:-translate-y-0.5"
          >
            הצטרפו עכשיו
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-white/50 text-sm">
            הצטרפות חינם · עמלה רק על עבודה שנסגרה
          </p>
        </div>
      </section>

      {/* ── Value props ── */}
      <section className="bg-white py-14 px-6 border-b border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            {
              icon: Gift,
              label: "הצטרפות חינם",
              sub: "בלי תשלום חודשי ובלי עמלת רישום",
            },
            {
              icon: TrendingUp,
              label: "עמלה רק על הצלחה",
              sub: "אתם משלמים רק על עבודות שנסגרו דרך הפלטפורמה",
            },
            {
              icon: Users,
              label: "מרוויחים על הפניות",
              sub: "קבלו עמלה על ספקים שאתם מפנים אלינו",
            },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary mb-3">
                <Icon className="h-6 w-6" />
              </div>
              <div className="font-bold text-text-main">{label}</div>
              <div className="text-text-muted text-sm mt-1">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="py-20 px-6 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-text-main">
              למה {BRAND_NAME}?
            </h2>
            <p className="text-text-muted mt-2 max-w-xl mx-auto">
              כל הכלים שצריך כדי להצליח, במקום אחד
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                title: "לוח שנה חכם",
                desc: "סנכרון Google Calendar, ניהול זמינות בזמן אמת. לקוחות רואים רק תאריכים שבהם אתם פנויים.",
                color: "bg-blue-100 text-blue-600",
              },
              {
                icon: TrendingUp,
                title: "לידים איכותיים",
                desc: "לקוחות מוכנים לרכישה, ללא בזבוז זמן. כל פנייה מגיעה עם פרטי האירוע והתאריך.",
                color: "bg-amber-100 text-amber-600",
              },
              {
                icon: Camera,
                title: "ניהול עסקי",
                desc: "כלים לניהול פגישות ואנליטיקה. ראו כמה זוגות צפו בפרופיל ומאיפה מגיעות הפניות.",
                color: "bg-green-100 text-green-600",
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-border p-6 hover:shadow-lg transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-text-main text-lg mb-2">{title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-text-main">
              איך מתחילים?
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                step: "01",
                title: "צרו פרופיל",
                desc: "מלאו פרטים בסיסיים, הוסיפו תמונות מתיק העבודות שלכם, והגדירו חבילות ומחירים.",
                time: "15 דקות",
              },
              {
                step: "02",
                title: "חברו לוח שנה",
                desc: `סנכרנו את Google Calendar שלכם. כשאתם תפוסים, ${BRAND_NAME} יסמן תאריכים חסומים אוטומטית.`,
                time: "2 דקות",
              },
              {
                step: "03",
                title: "קבלו פניות",
                desc: "זוגות יפנו אליכם ישירות, תאשרו פגישות, ותנהלו הכל מהפאנל שלכם.",
                time: "מתמשך",
              },
            ].map(({ step, title, desc, time }, idx) => (
              <div
                key={step}
                className="flex items-start gap-6 p-6 bg-surface rounded-2xl border border-border"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                  {step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-text-main text-lg">{title}</h3>
                    <span className="text-xs font-bold text-primary bg-primary-light px-2.5 py-1 rounded-full whitespace-nowrap">
                      {time}
                    </span>
                  </div>
                  <p className="text-text-muted text-sm mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why suppliers trust us ── */}
      <section className="py-20 px-6 bg-surface">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-text-main">
              ספקים מהטופ של ישראל
            </h2>
            <p className="text-text-muted mt-2 max-w-xl mx-auto">
              {BRAND_NAME} היא קהילה סגורה של ספקים מאומתים — לא מאגר פתוח. אנחנו מצרפים רק את הטובים בכל קטגוריה.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: "ספקים מאומתים בלבד",
                text: "כל ספק עובר אימות לפני שהוא עולה לפלטפורמה. הזוגות יודעים שהם פונים למקצוענים אמיתיים.",
              },
              {
                icon: Calendar,
                title: "זמינות אמיתית",
                text: "הזוגות רואים מראש מתי אתם פנויים, כך שמגיעות אליכם רק פניות שמתאימות לתאריך שלכם.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-border p-6 space-y-3"
              >
                <div className="w-11 h-11 rounded-2xl bg-primary-light flex items-center justify-center text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-text-main text-lg">{title}</h3>
                <p className="text-text-muted leading-relaxed text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-text-main">שאלות נפוצות</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <details
                key={q}
                className="group bg-surface rounded-2xl border border-border overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer font-semibold text-text-main list-none hover:bg-primary-light/30 transition-colors">
                  {q}
                  <ChevronLeft className="h-4 w-4 text-text-muted group-open:-rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-6 pb-5 text-text-muted text-sm leading-relaxed border-t border-border">
                  <div className="pt-4">{a}</div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 bg-gradient-to-br from-amber-50 to-rose-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-text-main mb-4">
            מוכנים להתחיל?
          </h2>
          <p className="text-lg text-text-muted mb-8">
            הצטרפו לקהילת הספקים שלנו וקבלו גישה לזוגות חדשים — בלי עלות מראש
          </p>
          <Link
            href="/supplier/join"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold text-xl px-12 py-5 rounded-full shadow-xl hover:shadow-2xl hover:bg-primary-dark transition-all duration-200 hover:-translate-y-1"
          >
            הצטרפו עכשיו
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-text-muted">
            {["הצטרפות חינם", "עמלה רק על עבודה שנסגרה", "ביטול בכל עת"].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
          <TopEventsLogo size="sm" />
          <div className="flex gap-6">
            <Link href="/" className="hover:text-white/80 transition-colors">לזוגות</Link>
            <Link href="/terms" className="hover:text-white/80 transition-colors">תנאי שימוש</Link>
            <Link href="/privacy" className="hover:text-white/80 transition-colors">פרטיות</Link>
            <Link href="/contact" className="hover:text-white/80 transition-colors">יצירת קשר</Link>
          </div>
          <span>© {new Date().getFullYear()} {BRAND_NAME}</span>
        </div>
      </footer>
    </div>
  );
}
