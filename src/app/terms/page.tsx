import type { Metadata } from "next";
import Link from "next/link";
import LegalPageShell from "@/components/legal/LegalPageShell";
import { BRAND_NAME, SUPPORT_EMAIL } from "@/lib/branding";

export const metadata: Metadata = {
  title: "תנאי שימוש",
  description: `תנאי השימוש של ${BRAND_NAME} ללקוחות וספקים.`,
};

export default function TermsPage() {
  return (
    <LegalPageShell title="תנאי שימוש" updated="יוני 2026">
      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. הסכמה לתנאים</h2>
        <p>
          השימוש ב־{BRAND_NAME} (topeventer.co.il) מהווה הסכמה לתנאים אלה. מי
          שאינו מסכים — מתבקש שלא להשתמש בשירות.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">2. מהות השירות</h2>
        <p>
          {BRAND_NAME} היא <strong>פלטפורמת תיווך וגילוי בלבד</strong>. אנו
          מקשרים בין לקוחות לספקים עצמאיים. איננו ספקי השירות, וההתקשרות לביצוע
          האירוע נכרתת ישירות בין הלקוח לספק.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">3. זמינות</h2>
        <p>
          נתוני הזמינות מבוססים על יומני הספקים (סנכרון Google Calendar או הזנה
          ידנית). הזמינות היא אינדיקציה בלבד ואינה מהווה אישור הזמנה סופי. אישור
          כפוף לתגובת הספק.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">4. תשלומים</h2>
        <p>
          ככל שיתבצעו תשלומים דרך הפלטפורמה, פרטי החיוב יוצגו בבירור טרם
          האישור. תשלומים מעובדים באמצעות ספק סליקה חיצוני; איננו שומרים פרטי
          כרטיס אשראי מלאים.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">5. פרטיות</h2>
        <p>
          השימוש במידע האישי כפוף ל־{" "}
          <Link href="/privacy" className="text-primary font-semibold hover:underline">
            מדיניות הפרטיות
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">6. ספקים</h2>
        <p>
          ספקים הרשומים לפלטפורמה מסכימים בנוסף לתנאי הספק, כולל דמי מנוי,
          מדיניות עמלות והתחייבות לדיוק זמינות. פרטים מלאים מוצגים בתהליך
          ההצטרפות.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">7. שימוש הוגן</h2>
        <p>
          אסור ליצור חשבונות מזויפים, לפרסם תוכן פוגעני, לנסות לעקוף תשלומים,
          או לנצל לרעה את מנגנון ההזמנות. אנו רשאים להשעות או למחוק חשבונות
          המפרים תנאים אלה.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">8. אחריות ודין</h2>
        <p>
          השירות מסופק &quot;כפי שהוא&quot;. בכפוף לדין, אחריותנו מוגבלת ואינה
          חלה על מעשי ספקים. על תנאים אלה חל דין מדינת ישראל; סמכות שיפוט —
          בתי המשפט המוסמכים במחוז תל אביב.
        </p>
      </section>

      <p className="text-sm text-text-muted pt-4 border-t border-border">
        ליצירת קשר:{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="text-primary font-semibold hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>
      </p>
    </LegalPageShell>
  );
}
