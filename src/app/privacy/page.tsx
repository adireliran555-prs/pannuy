import type { Metadata } from "next";
import LegalPageShell from "@/components/legal/LegalPageShell";
import {
  BRAND_CALENDAR_NAME,
  BRAND_NAME,
  SUPPORT_EMAIL,
} from "@/lib/branding";

export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description: `מדיניות הפרטיות של ${BRAND_NAME} — איסוף מידע, שימוש בנתונים וסנכרון Google Calendar.`,
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="מדיניות פרטיות" updated="יוני 2026">
      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. כללי</h2>
        <p>
          {BRAND_NAME} (&quot;הפלטפורמה&quot;, &quot;אנחנו&quot;) מפעילה את האתר
          topeventer.co.il לגילוי ספקי שירותים לאירועים בישראל. מדיניות זו
          מסבירה אילו נתונים אנו אוספים, כיצד אנו משתמשים בהם, ומהן זכויותיכם.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">2. מידע שאנו אוספים</h2>
        <ul className="list-disc pe-5 space-y-2">
          <li>
            <strong>לקוחות:</strong> שם, מספר טלפון (לאימות OTP), תאריך ואזור
            האירוע, העדפות חיפוש, ספקים שמורים ופגישות.
          </li>
          <li>
            <strong>ספקים:</strong> שם עסק, קטגוריה, אזורי שירות, תמונות,
            תיאור, מחירים, זמינות, פרטי התקשרות ופרטי תשלום לפי הצורך.
          </li>
          <li>
            <strong>טכני:</strong> כתובת IP, עוגיות הכרחיות לסשן, לוגים לצורכי
            אבטחה ותפעול.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">3. שימוש במידע</h2>
        <p>אנו משתמשים במידע כדי:</p>
        <ul className="list-disc pe-5 space-y-2">
          <li>להציג ספקים רלוונטיים וזמינות מעודכנת</li>
          <li>לאפשר קביעת פגישות ותקשורת בין לקוח לספק</li>
          <li>לאמת זהות (OTP) ולמנוע שימוש לרעה</li>
          <li>לשפר את השירות ולתמוך במשתמשים</li>
        </ul>
        <p>
          לא נמכור את המידע האישי שלכם לצדדים שלישיים. מספר טלפון של לקוח
          יועבר לספק רק כאשר הלקוח יוזם פנייה או הזמנה.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-primary/20 bg-primary-light/30 p-5">
        <h2 className="text-xl font-bold">4. Google Calendar (ספקים בלבד)</h2>
        <p>
          ספקים יכולים לבחור לחבר את חשבון Google Calendar שלהם לסנכרון
          זמינות. בעת החיבור אנו מבקשים הרשאות Google Calendar לצורך:
        </p>
        <ul className="list-disc pe-5 space-y-2">
          <li>
            יצירת יומן ייעודי בשם &quot;{BRAND_CALENDAR_NAME}&quot; בחשבון
            Google של הספק
          </li>
          <li>
            קריאה ועדכון של אירועים <strong>ביומן הייעודי בלבד</strong> — לצורך
            הצגת תאריכים חסומים ללקוחות
          </li>
          <li>קבלת עדכונים כאשר הספק מוסיף או משנה חסימות ביומן זה</li>
        </ul>
        <p>
          <strong>איננו קוראים, שומרים או מציגים</strong> אירועים ביומנים אישיים
          אחרים של הספק (למשל יומן משפחתי או עסקי נפרד). ההרשאה שאנו מבקשים
          (<code>calendar.app.created</code>) מאפשרת גישה <strong>אך ורק ליומן
          הייעודי שנוצר על ידי {BRAND_NAME}</strong> — לא ליומן הראשי ולא ליומנים
          אחרים בחשבון הספק. הספק שולט בתוכן שמוסיף ליומן {BRAND_NAME}.
        </p>
        <p>
          ניתן לנתק את Google Calendar בכל עת מהגדרות היומן בפאנל הספק או דרך
          הגדרות האבטחה של Google. עם הניתוק אנו מפסיקים לגשת לנתוני היומן ומוחקים
          את אסימוני הגישה השמורים.
        </p>
        <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
          <p className="font-semibold">
            שימוש מוגבל בנתוני Google (Limited Use)
          </p>
          <p>
            השימוש של {BRAND_NAME} במידע המתקבל מממשקי Google API, והעברתו לכל
            אפליקציה אחרת, כפוף ל־
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline"
            >
              Google API Services User Data Policy
            </a>
            , לרבות דרישות ה־Limited Use. בהתאם לכך, אנו משתמשים בנתוני
            Google Calendar אך ורק לצורך הצגת זמינות הספק וקביעת פגישות, איננו
            משתמשים בנתונים אלה לפרסום, איננו מוכרים אותם, ואיננו מעבירים אותם
            לצדדים שלישיים למעט לצורך אספקת השירות, בהתאם להסכמת המשתמש, או
            כנדרש על פי דין.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">5. אחסון ואבטחה</h2>
        <p>
          המידע מאוחסן בשרתים מאובטחים (Supabase, Vercel). אנו נוקטים באמצעי
          אבטחה סבירים בהתאם לתקנות הגנת הפרטיות (אבטחת מידע), התשע&quot;ז‑2017.
          אף מערכת אינה חסינה לחלוטין מפני פריצות.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">6. זכויותיכם</h2>
        <p>
          בהתאם לחוק הגנת הפרטיות, תוכלו לבקש לעיין במידע האישי שלכם, לתקנו
          או למחוק אותו — בפנייה ל־{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-primary font-semibold hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
          . נשיב בתוך זמן סביר.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">7. שינויים</h2>
        <p>
          נעדכן מדיניות זו מעת לעת. תאריך העדכון יופיע בראש העמוד. המשך שימוש
          לאחר עדכון מהווה הסכמה למדיניות המעודכנת.
        </p>
      </section>

      <p className="text-sm text-text-muted pt-4 border-t border-border">
        שאלות?{" "}
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
