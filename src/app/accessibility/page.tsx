import type { Metadata } from "next";
import LegalPageShell from "@/components/legal/LegalPageShell";
import { BRAND_NAME, SUPPORT_EMAIL } from "@/lib/branding";

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description: `הצהרת הנגישות של ${BRAND_NAME} — הסדרי הנגישות באתר ודרכי פנייה לרכז הנגישות.`,
};

export default function AccessibilityPage() {
  return (
    <LegalPageShell title="הצהרת נגישות" updated="יולי 2026">
      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. המחויבות שלנו לנגישות</h2>
        <p>
          ב־{BRAND_NAME} אנו רואים חשיבות רבה במתן שירות שוויוני ונגיש לכלל
          המשתמשים, לרבות אנשים עם מוגבלות. אנו פועלים כדי להנגיש את האתר
          topeventer.co.il ולאפשר חוויית שימוש נוחה, מכבדת ועצמאית לכל אדם.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">2. התקן שלפיו הונגש האתר</h2>
        <p>
          הנגשת האתר בוצעה בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות
          נגישות לשירות), התשע&quot;ג‑2013, ולתקן הישראלי ת&quot;י 5568 בדבר
          נגישות תכנים באינטרנט, המבוסס על הנחיות{" "}
          <span dir="ltr">WCAG 2.0</span> ברמת <span dir="ltr">AA</span>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">3. הסדרי הנגישות באתר</h2>
        <ul className="list-disc pe-5 space-y-2">
          <li>האתר בנוי במבנה סמנטי תקני התומך בקוראי מסך.</li>
          <li>ניתן לנווט באתר באמצעות מקלדת בלבד (מקש Tab וחיצים).</li>
          <li>
            שמירה על ניגודיות צבעים מספקת בין הטקסט לרקע לשיפור הקריאוּת.
          </li>
          <li>טקסט חלופי (alt) לתמונות בעלות משמעות.</li>
          <li>
            תמיכה מלאה בכיווניות מימין לשמאל (עברית) ובהתאמה למסכים בגדלים שונים,
            כולל מכשירים ניידים.
          </li>
          <li>
            שימוש בגופנים ברורים ובמבנה עמודים עקבי לאורך כל האתר.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">4. סייגים לנגישות</h2>
        <p>
          למרות מאמצינו להנגיש את כל דפי האתר, ייתכן שחלקים מסוימים — ובפרט תכנים
          שמקורם בצדדים שלישיים (כגון תמונות שהעלו ספקים, תוכן מוטמע או שירותים
          חיצוניים) — טרם הונגשו במלואם. אנו ממשיכים לפעול לשיפור מתמיד של הנגישות
          באתר.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-primary/20 bg-primary-light/30 p-5">
        <h2 className="text-xl font-bold">5. פנייה בנושא נגישות</h2>
        <p>
          נתקלתם בבעיית נגישות, או שיש לכם הצעה לשיפור? נשמח לקבל את פנייתכם.
          פנייה כזו תטופל בהקדם האפשרי על ידי רכז הנגישות שלנו.
        </p>
        <ul className="list-none space-y-1">
          <li>
            <strong>רכז נגישות:</strong> צוות {BRAND_NAME}
          </li>
          <li>
            <strong>דוא&quot;ל:</strong>{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-primary font-semibold hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </li>
          <li>
            <strong>טלפון:</strong>{" "}
            <a
              href="tel:+972508263639"
              dir="ltr"
              className="text-primary font-semibold hover:underline"
            >
              050-8263639
            </a>
          </li>
        </ul>
        <p>
          בפנייתכם נשמח שתפרטו את הבעיה, הדף שבו נתקלתם בה וסוג הדפדפן/הטכנולוגיה
          המסייעת שבה השתמשתם — כדי שנוכל לטפל במהירות וביעילות.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">6. עדכון ההצהרה</h2>
        <p>
          הצהרת נגישות זו מתעדכנת מעת לעת בהתאם לשיפורים המתבצעים באתר. תאריך
          העדכון האחרון מופיע בראש העמוד.
        </p>
      </section>
    </LegalPageShell>
  );
}
