import type { Metadata } from "next";
import LegalPageShell from "@/components/legal/LegalPageShell";
import { BRAND_NAME } from "@/lib/branding";
import { AGENT_REFERRAL_RATE, formatRate } from "@/lib/commission";

export const metadata: Metadata = {
  title: "תנאי תוכנית הסוכנים",
  description: `תנאי ההשתתפות בתוכנית הסוכנים של ${BRAND_NAME}.`,
};

export default function AgentTermsPage() {
  return (
    <LegalPageShell title="תנאי תוכנית הסוכנים" updated="נובמבר 2026">
      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. מהות התוכנית</h2>
        <p>
          סוכן/ת הוא/היא אדם המפנה לקוחות (זוגות ומזמיני אירועים) או ספקים לפלטפורמת {BRAND_NAME}
          באמצעות קישור או קוד הפניה אישי. הסוכן אינו ספק שירותים בפלטפורמה, אינו מופיע בחיפוש,
          ואינו צד לעסקה בין לקוח לספק.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">2. עמלת הפניה</h2>
        <p>
          בגין כל עסקה שנסגרה והתקיימה בפועל בין לקוח לספק, כאשר הלקוח או הספק נרשמו לפלטפורמה דרך קוד ההפניה
          של הסוכן, זכאי הסוכן לעמלה בשיעור <strong>{formatRate(AGENT_REFERRAL_RATE)}</strong> משווי העסקה
          (לפני מע״מ) כפי שדווח על ידי הספק. העמלה משולמת מתוך עמלת הפלטפורמה ואינה מוסיפה עלות ללקוח או לספק.
        </p>
        <p>
          שיוך הפניה תקף ל־30 יום מרגע הלחיצה על הקישור ונקבע במועד ההרשמה. עמלה נרשמת כ״ממתינה״ עם אישור
          הפגישה, מאושרת לתשלום לאחר שהאירוע התקיים והספק סימן אותו כהושלם, ומשולמת במרוכז אחת לחודש כנגד
          חשבונית או קבלה כדין.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">3. התנהלות</h2>
        <p>
          הסוכן מתחייב לא להציג מצג מטעה לגבי הפלטפורמה או הספקים, לא לשלוח דיוור ללא הסכמה בניגוד לחוק
          התקשורת, ולא ליצור הרשמות מלאכותיות. {BRAND_NAME} רשאית לבטל עמלות שמקורן בהפרה ולהשעות את
          חשבון הסוכן.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">4. מעמד הצדדים</h2>
        <p>
          אין בין הסוכן ל־{BRAND_NAME} יחסי עובד־מעביד, שותפות או שליחות. הסוכן אחראי לדיווחי המס שלו בגין
          העמלות.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">5. שינויים וסיום</h2>
        <p>
          {BRAND_NAME} רשאית לעדכן את שיעור העמלה ואת תנאי התוכנית בהודעה של 14 יום מראש בפאנל הסוכנים.
          שינוי לא יחול על עמלות שכבר אושרו. כל צד רשאי לסיים את ההשתתפות בכל עת; עמלות שאושרו ישולמו.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">6. דין וסמכות</h2>
        <p>על תנאים אלה יחולו דיני מדינת ישראל, וסמכות השיפוט הייחודית נתונה לבתי המשפט במחוז תל אביב־יפו.</p>
      </section>
    </LegalPageShell>
  );
}
