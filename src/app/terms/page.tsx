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
    <LegalPageShell title="תנאי שימוש" updated="אוגוסט 2026">
      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. הסכמה לתנאים ופרטי המפעיל</h2>
        <p>
          השימוש ב־{BRAND_NAME} (topeventer.co.il) מהווה הסכמה לתנאים אלה. מי
          שאינו מסכים — מתבקש שלא להשתמש בשירות. {BRAND_NAME} מופעל על ידי
          אדיר הלפון (עוסק בהליכי רישום); ניתן לפנות אלינו בכתובת{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-primary font-semibold hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>{" "}
          או בטלפון{" "}
          <a href="tel:+972508263639" dir="ltr" className="text-primary font-semibold hover:underline">
            050-8263639
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">2. מי רשאי להשתמש בשירות</h2>
        <p>
          השירות מיועד לבגירים כבני 18 ומעלה, בעלי כשירות משפטית להתקשר
          בהסכם. קטין רשאי להשתמש בשירות רק באישור ובליווי הורה או אפוטרופוס.
          אתם אחראים לשמירת סודיות קוד האימות (OTP) שנשלח אליכם, ולכל פעולה
          שתתבצע בחשבונכם באמצעותו.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">3. מהות השירות</h2>
        <p>
          {BRAND_NAME} היא <strong>פלטפורמת תיווך וגילוי בלבד</strong>. אנו
          מקשרים בין לקוחות לספקים עצמאיים. איננו ספקי השירות, וההתקשרות לביצוע
          האירוע נכרתת ישירות בין הלקוח לספק בעת שהספק מאשר את הפנייה — אנו
          איננו צד להתקשרות זו ואיננו אחראים לביצועה.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">4. זמינות</h2>
        <p>
          נתוני הזמינות מבוססים על יומני הספקים (סנכרון Google Calendar או הזנה
          ידנית). הזמינות היא אינדיקציה בלבד ואינה מהווה אישור הזמנה סופי. אישור
          כפוף לתגובת הספק.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">5. מקדמות, ביטולים ואי‑הגעה</h2>
        <p>
          ככל שתתבצע גביית מקדמה דרך הפלטפורמה, פרטי התשלום והסכום המלא (כולל
          מע&quot;מ) יוצגו לפניכם בבירור טרם החיוב. תשלומים מעובדים באמצעות ספק
          סליקה חיצוני העומד בתקן PCI‑DSS; איננו שומרים פרטי כרטיס אשראי
          מלאים.
        </p>
        <p>
          עסקה מרחוק לרכישת שירות ניתנת לביטול בתוך 14 יום ממועד ביצועה, בכפוף
          לחריגים שבדין — ובפרט שירותים המיועדים למועד קבוע (כגון אירוח או
          הפעלה באירוע) עשויים להיות מוחרגים מזכות הביטול כאשר הביטול נעשה
          בסמוך למועד השירות. מדיניות הביטול המדויקת של כל ספק תוצג טרם
          ביצוע התשלום. דמי ביטול, ככל שיחולו, לא יעלו על המותר בדין. אי‑הגעה
          (no‑show) של לקוח או ספק תטופל מול הצד השני בהתאם למדיניות הביטול
          שהוצגה, וללא אחריות שלנו לנזק שנגרם כתוצאה ממנה.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">6. פרטיות</h2>
        <p>
          השימוש במידע האישי כפוף ל־{" "}
          <Link href="/privacy" className="text-primary font-semibold hover:underline">
            מדיניות הפרטיות
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">7. ספקים</h2>
        <p>
          ספקים הרשומים לפלטפורמה מסכימים בנוסף להסכם הספק, המוצג ומאושר
          במלואו בתהליך ההצטרפות וכולל, בין היתר, דמי מנוי, מנגנון עמלות
          הפניה, איסור עקיפת הפלטפורמה, אופן העברת פניות לקוחות, והתחייבות
          לדיוק הזמינות המוצגת.
        </p>
        <p>
          ספק המעלה תמונות או תוכן לפלטפורמה מצהיר כי הוא בעל הזכויות בהם,
          ומעניק ל‑{BRAND_NAME} רישיון שאינו בלעדי להציגם באתר ובפעילותנו
          השיווקית לצורך תפעול וקידום הפלטפורמה.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">8. תוכן, ביקורות והסרה</h2>
        <p>
          תלונות וחוות דעת חייבות להיות אמיתיות וענייניות; תוכן כוזב, מטעה או
          משמיץ עלול להיות מוסר. אנו רשאים להסיר תוכן מפר, מטעה או פוגעני,
          ולהשעות או למחוק חשבון של משתמש או ספק המפר תנאים אלה — לרבות ביטול
          פניות/הזמנות פתוחות הקשורות לחשבון שהוסר, ככל שאלה טרם קוימו בפועל.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">9. שימוש הוגן</h2>
        <p>
          אסור ליצור חשבונות מזויפים, לפרסם תוכן פוגעני, לנסות לעקוף תשלומים,
          או לנצל לרעה את מנגנון ההזמנות. אנו רשאים להשעות או למחוק חשבונות
          המפרים תנאים אלה.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">10. אחריות, מחלוקות ודין</h2>
        <p>
          השירות מסופק &quot;כפי שהוא&quot;. בכפוף לדין, אחריותנו מוגבלת ואינה
          חלה על מעשי או מחדלי ספקים. מחלוקת בין לקוח לספק ביחס לשירות
          שהוזמן היא עניינם של הצדדים להתקשרות; נשמח לסייע בתיווך ככל שנוכל,
          אך איננו צד לה. על תנאים אלה חל דין מדינת ישראל; סמכות שיפוט —
          בתי המשפט המוסמכים במחוז תל אביב.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">11. שינויים בתנאים</h2>
        <p>
          נעדכן תנאים אלה מעת לעת; תאריך העדכון יופיע בראש העמוד. שינוי מהותי
          יימסר בהודעה בולטת באתר.
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
