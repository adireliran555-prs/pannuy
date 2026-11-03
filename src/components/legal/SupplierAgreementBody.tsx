import {
  COMMISSION_RATE_BY_CATEGORY,
  COMMISSION_PAYMENT_DAYS,
  DEAL_REPORT_DAYS,
  LATE_PAYMENT_MONTHLY_INTEREST,
  formatRate,
} from "@/lib/commission";
import { CATEGORY_LABELS } from "@/lib/categories";
import { BRAND_NAME } from "@/lib/branding";

// Categories shown in the commission table — legacy ones excluded.
const TABLE_CATEGORIES = [
  "PHOTOGRAPHER",
  "VIDEOGRAPHER",
  "PHOTO_BOOTH",
  "DJ",
  "CATERING",
  "VENUE",
  "HAIR_STYLIST",
  "MAKEUP_ARTIST",
  "EVENT_PRODUCER",
] as const;

export function CommissionTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-start px-4 py-2 font-bold">סוג השירות</th>
            <th className="text-start px-4 py-2 font-bold">שיעור העמלה</th>
          </tr>
        </thead>
        <tbody>
          {TABLE_CATEGORIES.map((c) => (
            <tr key={c} className="border-t border-border">
              <td className="px-4 py-2">{CATEGORY_LABELS[c]}</td>
              <td className="px-4 py-2 font-semibold" dir="ltr">
                {formatRate(COMMISSION_RATE_BY_CATEGORY[c])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Full supplier agreement text. Shared by /legal/supplier-agreement and the signup modal. */
export default function SupplierAgreementBody() {
  return (
    <>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">מבוא</h2>
        <p>
          הסכם זה נכרת בין {BRAND_NAME} (להלן: ״המפעיל״) לבין הספק המצטרף לפלטפורמה, כפי שפרטיו
          מולאו בתהליך ההרשמה. הפלטפורמה פועלת כקהילה סגורה וסלקטיבית של ספקים
          נבחרים בלבד שעברו בדיקה, אימות והמלצות — ואינה מאגר פתוח לכל ספק
          המבקש להירשם.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. מהות ההתקשרות ומעמד הצדדים</h2>
        <p>
          הפלטפורמה היא פלטפורמת גילוי ותיווך בלבד. {BRAND_NAME} אינה צד לעסקה
          בין הספק ללקוח, אינה נותנת בעצמה את השירותים, ואינה אחראית לטיבם,
          לאיכותם או לביצועם. הספק פועל כקבלן עצמאי — אין ביחסים יחסי
          עובד־מעביד, שותפות, סוכנות או מיזם משותף. הספק אחראי בלעדית לניהול
          עסקו, לרישיונות, לביטוחים ולתשלומי המס שלו.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">2. הצטרפות, אימות ומעמד ספק נבחר</h2>
        <p>
          המפעיל שומר שיקול דעת בלעדי וסופי לגבי קבלה, אי־קבלה, השעיה או
          הסרה של ספק, בכל עת ומכל סיבה סבירה. הכללה בפלטפורמה אינה מהווה
          התחייבות להיקף פניות, לידים או עסקאות, ואינה ערובה להצלחה מסחרית.
          הספק מתחייב למסור מידע נכון ומעודכן, ולעדכן שינויים מהותיים בפרטיו.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">3. פרופיל, תוכן וקניין רוחני</h2>
        <p>
          הספק אחראי בלעדית לנכונות ולעדכניות תוכן פרופילו, ומצהיר שהוא בעל
          מלוא הזכויות בתוכן שהעלה. הספק מעניק למפעיל רישיון לא־בלעדי להציג
          ולהשתמש בתוכן זה לתפעול ולשיווק הפלטפורמה, כל עוד הוא מוצג בה.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">4. זמינות ולוח שנה</h2>
        <p>
          הספק מתחייב לשמור על דיוק נתוני הזמינות (סנכרון Google Calendar או
          הזנה ידנית). הצגת תאריך כ״פנוי״ היא מצג כלפי הלקוחות; אי־דיוק חוזר
          עשוי להוות עילה להשעיה או הסרה.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">5. טיפול בפניות ובעסקאות</h2>
        <p>
          על הספק להשיב לפנייה בפרק זמן סביר (מומלץ עד 24 שעות) ולנהל את
          ההתקשרות מול הלקוח ביושר ובתום לב. ההתקשרות המסחרית נכרתת ישירות
          בין הספק ללקוח; המפעיל אינו צד לה ואינו אחראי לביצועה.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">6. מודל תמחור, עמלות ותשלומים</h2>
        <p>
          ההצטרפות ופרופיל הספק ניתנים ללא תשלום, ואין דמי מנוי חודשיים או תשלום
          תקופתי מכל סוג. התשלום היחיד למפעיל הוא עמלה: בגין כל עסקה שמקורה
          בפנייה מהפלטפורמה, ישלם הספק למפעיל{" "}
          <strong>עמלת הצלחה כשיעור מהתמורה</strong> (לפני מע״מ), לפי סוג השירות
          כמפורט בטבלה שלהלן. העמלה חלה בין אם התשלום עבר בסליקת הפלטפורמה ובין
          אם שולם ישירות לספק. על הספק לדווח על סגירת עסקה בתוך {DEAL_REPORT_DAYS}{" "}
          ימים ולהעביר את העמלה בתוך {COMMISSION_PAYMENT_DAYS} ימים מקבלת כל
          תשלום מהלקוח. איחור בתשלום נושא הפרשי הצמדה וריבית פיגורים כדין, או
          ריבית חוזית של {formatRate(LATE_PAYMENT_MONTHLY_INTEREST)} לחודש (הגבוה
          מביניהם), החל מהיום ה־15 לאיחור. העמלה אינה כוללת מע״מ.
        </p>
        <CommissionTable />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">
          7. איסור עקיפת הפלטפורמה ופיצוי מוסכם
        </h2>
        <p>
          הספק מתחייב שלא לפעול, במישרין או בעקיפין, לסגירת עסקה עם לקוח
          שהגיע דרך הפלטפורמה תוך עקיפת מנגנון הדיווח והעמלה — לרבות תשלום
          ישיר, ביטול הזמנה בפלטפורמה ופתיחת התקשרות מקבילה בערוץ אחר, או כל
          דרך אחרת שתכליתה התחמקות מעמלה. עסקה שנכרתה בתוך 24 חודשים ממועד
          הפנייה הראשונה ולא דווחה תיחשב עקיפה לכאורה, אלא אם הוכיח הספק
          אחרת. בגין עקיפה כאמור ישלם הספק למפעיל פיצוי מוסכם ומוערך מראש בסך{" "}
          <strong>40,000 ₪</strong>, מבלי לגרוע מזכות המפעיל לסעדים נוספים.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">8. סודיות</h2>
        <p>
          הספק מתחייב לשמור בסודיות כל מידע שאינו נחלת הכלל שהגיע לידיו בקשר
          עם הפלטפורמה — לרבות פרטי לקוחות, מודל התמחור והעמלות, ואופן פעולתה
          העסקי והטכנולוגי — במהלך ההתקשרות ולמשך 7 שנים לאחריה.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">9. הגנת הפרטיות של לקוחות</h2>
        <p>
          פרטי לקוחות המועברים לספק דרך הפלטפורמה נמסרים לו למטרה אחת ויחידה
          — מענה לפנייה וניהול ההתקשרות המסחרית. הספק מתחייב שלא לשלוח דיוור
          שיווקי ללא הסכמה מפורשת, שלא להעביר את המידע לצד שלישי, לנקוט
          אבטחת מידע סבירה, ולמחוק את פרטי הלקוח לפי דרישה.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">10. הוראות נוספות</h2>
        <p>
          איסור הטעיה וביקורות כוזבות; הסכם זה בתוקף לתקופה של{" "}
          <strong>שנה אחת</strong> ממועד אישורו, ומתחדש אוטומטית מדי שנה,
          אלא אם נמסרה{" "}
          <strong>הודעה בכתב של 90 יום מראש</strong> על אי־חידושו; מדיניות
          הפרות והשעיה לאלתר במקרים חמורים; הגבלת אחריות והתחייבות שיפוי; קניין
          רוחני של הפלטפורמה שייך למפעיל בלבד; שינויים בהסכם יימסרו בהודעה
          מראש; דיני מדינת ישראל וסמכות שיפוט ייחודית לבתי המשפט במחוז תל אביב.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">11. אישור והסכמה</h2>
        <p>
          אישור הסכם זה, לרבות בדרך של סימון תיבת אישור דיגיטלית בתהליך
          ההרשמה, מהווה הסכמה מחייבת מבחינה משפטית וחתימה אלקטרונית כמשמעה
          בחוק חתימה אלקטרונית, תשס״א־2001. המערכת שומרת רישום הכולל את זהות
          הספק המאומתת (מספר טלפון שאומת בקוד חד־פעמי), את גרסת ההסכם שאושרה,
          ואת מועד וכתובת ה־IP של האישור, כראיה לכריתת ההסכם.
        </p>
      </section>
    </>
  );
}
