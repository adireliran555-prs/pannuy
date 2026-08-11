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
    <LegalPageShell title="מדיניות פרטיות" updated="אוגוסט 2026">
      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. כללי</h2>
        <p>
          {BRAND_NAME} (&quot;הפלטפורמה&quot;, &quot;אנחנו&quot;) מפעילה את האתר
          topeventer.co.il לגילוי ספקי שירותים לאירועים בישראל. מדיניות זו
          מסבירה אילו נתונים אנו אוספים, כיצד אנו משתמשים בהם, למי הם עשויים
          להימסר, ומהן זכויותיכם לפי חוק הגנת הפרטיות, התשמ&quot;א‑1981.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">
          2. בעל השליטה במאגר המידע ודרכי יצירת קשר
        </h2>
        <p>
          בעל השליטה במאגר המידע הוא אדיר הלפון, מייסד ומפעיל
          topeventer.co.il (עוסק בהליכי רישום). ניתן לפנות אליו בכל הנוגע
          למאגר המידע — לרבות בקשות לעיון, תיקון או מחיקה — באמצעות:
        </p>
        <ul className="list-none space-y-1">
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
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">3. מידע שאנו אוספים</h2>
        <ul className="list-disc pe-5 space-y-2">
          <li>
            <strong>לקוחות:</strong> שם, מספר טלפון (לאימות OTP), תאריך ואזור
            האירוע, העדפות חיפוש, ספקים שמורים ופגישות.
          </li>
          <li>
            <strong>ספקים:</strong> שם עסק, קטגוריה, אזורי שירות, תמונות,
            תיאור, מחירים, זמינות, פרטי התקשרות ופרטי תשלום לפי הצורך. בטופס
            ההצטרפות נאספים שם מלא, מספר טלפון וכתובת דוא&quot;ל לצורך אימות
            (OTP) ותפעול הפרופיל בלבד; מסירת הפרטים היא תנאי להצטרפות
            כספק ואי‑מסירתם תמנע השלמת ההרשמה.
          </li>
          <li>
            <strong>טכני:</strong> כתובת IP, עוגיות הכרחיות לסשן, לוגים לצורכי
            אבטחה ותפעול.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">4. שימוש במידע</h2>
        <p>אנו משתמשים במידע כדי:</p>
        <ul className="list-disc pe-5 space-y-2">
          <li>להציג ספקים רלוונטיים וזמינות מעודכנת</li>
          <li>לאפשר קביעת פגישות ותקשורת בין לקוח לספק</li>
          <li>לאמת זהות (OTP) ולמנוע שימוש לרעה</li>
          <li>לשפר את השירות ולתמוך במשתמשים</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">5. למי המידע עשוי להימסר</h2>
        <p>
          לא נמכור את המידע האישי שלכם לצדדים שלישיים. המידע עשוי להימסר
          לגורמים הבאים, אך ורק לצורך תפעול השירות:
        </p>
        <ul className="list-disc pe-5 space-y-2">
          <li>
            <strong>לספק שאתם פונים אליו:</strong> מספר הטלפון של לקוח יועבר
            לספק רק כאשר הלקוח יוזם פנייה או הזמנה, ולמטרת אותה התקשרות
            בלבד.
          </li>
          <li>
            <strong>ספקי תשתית ואחסון:</strong> Supabase (בסיס נתונים) ו‑Vercel
            (אחסון והרצת האתר).
          </li>
          <li>
            <strong>Google:</strong> לצורך התחברות (OAuth) וסנכרון Google
            Calendar לספקים שבחרו בכך — ראו סעיף 7.
          </li>
          <li>
            <strong>ספק שירותי מסרונים (Telnyx):</strong> לצורך שליחת קוד
            אימות (OTP) למספר הטלפון שלכם.
          </li>
          <li>
            <strong>ספק סליקה חיצוני:</strong> ככל שיופעל תשלום מקוון
            בפלטפורמה (למשל מקדמה לספק), התשלום יעובד על ידי ספק סליקה עומד
            בתקן PCI‑DSS; איננו שומרים פרטי כרטיס אשראי מלאים.
          </li>
          <li>
            <strong>יועצים מקצועיים ורשויות:</strong> רואה חשבון, יועץ משפטי,
            ורשויות מוסמכות — ככל שנדרש לפי דין.
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border border-primary/20 bg-primary-light/30 p-5">
        <h2 className="text-xl font-bold">6. Google Calendar (ספקים בלבד)</h2>
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
        <h2 className="text-xl font-bold">
          7. אחסון, אבטחה והעברת מידע מחוץ לישראל
        </h2>
        <p>
          המידע מאוחסן בשרתים מאובטחים של Supabase (בסיס הנתונים הראשי מתארח
          באיחוד האירופי) ו‑Vercel. אנו נוקטים באמצעי אבטחה סבירים בהתאם
          לתקנות הגנת הפרטיות (אבטחת מידע), התשע&quot;ז‑2017. אף מערכת אינה
          חסינה לחלוטין מפני פריצות.
        </p>
        <p>
          חלק מהעיבוד — לרבות שירותי Google ו‑Vercel — עשוי להתבצע על שרתים
          מחוץ לישראל. העברת מידע כאמור נעשית בכפוף לתקנות הגנת הפרטיות (העברת
          מידע אל מאגרי מידע שמחוץ לגבולות המדינה), התשס&quot;א‑2001, ובהתבסס
          על התחייבויות ההגנה על פרטיות של אותם ספקים.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">8. תקופת שמירת המידע</h2>
        <ul className="list-disc pe-5 space-y-2">
          <li>קוד אימות (OTP) — נמחק מיד לאחר שימוש או פקיעת תוקף.</li>
          <li>
            פרטי חשבון לקוח או ספק, פגישות ותכתובות — נשמרים כל עוד החשבון
            פעיל, ועד 24 חודשים לאחר בקשת סגירת חשבון או מחיקה, אלא אם נדרשת
            שמירה ארוכה יותר לפי דין (למשל לצורכי מס).
          </li>
          <li>לוגים טכניים ואבטחה — עד 12 חודשים.</li>
        </ul>
        <p>
          ניתן לבקש מחיקה מוקדמת יותר בכפוף לסעיף 9; מידע שנדרש לשמירה על פי
          דין (כגון רישומים חשבונאיים) לא יימחק לפני תום תקופת החובה החוקית.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">9. זכויותיכם</h2>
        <p>
          בהתאם לחוק הגנת הפרטיות, תוכלו לבקש לעיין במידע האישי שלכם, לתקנו
          או למחוק אותו — בפנייה ל־{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-primary font-semibold hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
          . נשיב לבקשת עיון בתוך 30 יום ממועד קבלתה, כנדרש בדין.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">10. דיוור שיווקי</h2>
        <p>
          נשלח לכם הודעות שיווקיות (כגון עדכוני מבצעים) רק אם נתתם לכך הסכמה
          מפורשת ונפרדת, בהתאם לסעיף 30א לחוק התקשורת (בזק ושידורים). הסכמה זו
          נפרדת מהסכמתכם לתנאי השימוש ולמדיניות זו, וניתן לבטלה בכל עת דרך
          קישור ההסרה שבהודעה או בפנייה אלינו.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">11. שינויים</h2>
        <p>
          נעדכן מדיניות זו מעת לעת. תאריך העדכון יופיע בראש העמוד. שינוי שאינו
          מהותי ייכנס לתוקף עם פרסומו והמשך השימוש לאחריו מהווה הסכמה. שינוי
          מהותי במטרות איסוף המידע או בשימושים בו יימסר בהודעה בולטת באתר, ואם
          נדרש בדין — נבקש את הסכמתכם המחודשת בטרם החלתו.
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
