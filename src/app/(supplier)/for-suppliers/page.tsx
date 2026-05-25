import Link from "next/link";
import { Camera, Calendar, TrendingUp, CheckCircle, ChevronLeft, Star } from "lucide-react";

const FAQS = [
  {
    q: "האם ההצטרפות לפנוי כרוכה בתשלום?",
    a: "לא! ההצטרפות לפנוי חינמית לחלוטין. אנחנו לוקחים עמלה רק על עסקאות שמסתכמות בהצלחה. אין תשלום חודשי, אין עמלת רישום.",
  },
  {
    q: "כמה זמן לוקח להקים פרופיל?",
    a: "פחות מ-15 דקות. תמלאי פרטים בסיסיים, תעלי תמונות מתיק העבודות שלך, ותגדירי חבילות ומחירים. אנחנו נבצע אימות קצר ותהיי חיה!",
  },
  {
    q: "איך מנהלים את הזמינות?",
    a: "ניתן לסנכרן אוטומטית עם Google Calendar שלך, או לנהל ידנית ישירות בפלטפורמה. כשיש לך אירוע ביומן, פנוי תסמן את היום כחסום אוטומטית.",
  },
  {
    q: "מה קורה כשכלה מבקשת פגישה?",
    a: "תקבלי התראה מיידית, תוכלי לאשר או לדחות תוך שניות, ותתקשרי עם הכלה ישירות דרך הפלטפורמה. ללא ביניים.",
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
            לצלמות חתונה
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-4">
            הציגי את האמנות שלך
            <br />
            <span className="text-primary">לאלפי כלות</span>
          </h1>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto leading-relaxed">
            הצטרפי לפנוי — הפלטפורמה המובילה לספקי חתונות בישראל. לקבל לידים איכותיים ולנהל פגישות בקלות.
          </p>
          <Link
            href="/supplier/join"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold text-lg px-10 py-5 rounded-full shadow-2xl hover:shadow-primary/30 hover:bg-primary-dark transition-all duration-200 hover:-translate-y-0.5"
          >
            הצטרפי בחינם
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-white/50 text-sm">
            ללא עמלת רישום · אין תשלום חודשי
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-white py-14 px-6 border-b border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { value: "150+", label: "צלמות פעילות", sub: "ועוד מצטרפות מדי שבוע" },
            { value: "₪8,500", label: "הכנסה חודשית ממוצעת", sub: "לצלמת פעילה בפלטפורמה" },
            { value: "4.9 ⭐", label: "דירוג ממוצע", sub: "מדד שביעות הרצון שלנו" },
          ].map(({ value, label, sub }) => (
            <div key={label}>
              <div className="text-4xl font-black text-primary mb-1">{value}</div>
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
              למה פנוי?
            </h2>
            <p className="text-text-muted mt-2 max-w-xl mx-auto">
              הכלים שאת צריכה כדי להצליח, במקום אחד
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                title: "לוח שנה חכם",
                desc: "סנכרון Google Calendar, ניהול זמינות בזמן אמת. כלות רואות רק תאריכים שאת פנויה בהם.",
                color: "bg-blue-100 text-blue-600",
              },
              {
                icon: TrendingUp,
                title: "לידים איכותיים",
                desc: "כלות מוכנות לרכישה, ללא בזבוז זמן. כל פנייה מגיעה עם פרטי החתונה ותאריך הנישואין.",
                color: "bg-amber-100 text-amber-600",
              },
              {
                icon: Camera,
                title: "ניהול עסקי",
                desc: "כלים לניהול פגישות, ביקורות ואנליטיקה. ראי כמה כלות צפו בפרופיל ואיפה מגיעות הפניות.",
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
                title: "צרי פרופיל",
                desc: "מלאי פרטים בסיסיים, הוסיפי תמונות מתיק העבודות שלך, והגדירי חבילות ומחירים.",
                time: "15 דקות",
              },
              {
                step: "02",
                title: "חברי לוח שנה",
                desc: "סנכרן את Google Calendar שלך לניהול זמינות אוטומטי. כשאת תפוסה, פנוי תדאג שכלות לא יבקשו.",
                time: "2 דקות",
              },
              {
                step: "03",
                title: "קבלי פניות",
                desc: "כלות יפנו אליך ישירות, תאשרי פגישות, ותנהלי הכל מהפאנל שלך.",
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

      {/* ── Testimonials ── */}
      <section className="py-20 px-6 bg-surface">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-text-main">
              מה הצלמות אומרות
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                name: "ריבה אורן",
                city: "תל אביב",
                rating: 5,
                text: "מאז שהצטרפתי לפנוי, מספר הפניות שלי גדל פי 3. הכלים ניהול הזמינות והפגישות חוסכים לי שעות בשבוע.",
              },
              {
                name: "טל חיון",
                city: "ירושלים",
                rating: 5,
                text: "הפלטפורמה הכי ידידותית שנתקלתי בה. הפרופיל שלי מביא לידים איכותיים מכלות שבאמת רוצות להתקדם.",
              },
            ].map(({ name, city, rating, text }) => (
              <div
                key={name}
                className="bg-white rounded-2xl border border-border p-6 space-y-4"
              >
                <div className="flex items-center gap-1">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-text-muted leading-relaxed">&quot;{text}&quot;</p>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm">
                    {name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-text-main text-sm">{name}</p>
                    <p className="text-text-muted text-xs">{city}</p>
                  </div>
                </div>
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
            מוכנה להתחיל?
          </h2>
          <p className="text-lg text-text-muted mb-8">
            הצטרפי לקהילת הצלמות שלנו וקבלי גישה לאלפי כלות חדשות בכל חודש
          </p>
          <Link
            href="/supplier/join"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold text-xl px-12 py-5 rounded-full shadow-xl hover:shadow-2xl hover:bg-primary-dark transition-all duration-200 hover:-translate-y-1"
          >
            הצטרפי בחינם
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-text-muted">
            {["ללא עמלת רישום", "אין תשלום חודשי", "ביטול בכל עת"].map((item) => (
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
          <span className="text-2xl font-black text-primary">פנוי</span>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-white/80 transition-colors">לכלות</Link>
            <Link href="#" className="hover:text-white/80 transition-colors">תנאי שימוש</Link>
            <Link href="#" className="hover:text-white/80 transition-colors">פרטיות</Link>
          </div>
          <span>© 2025 פנוי</span>
        </div>
      </footer>
    </div>
  );
}
