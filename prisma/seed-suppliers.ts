/**
 * Additive, idempotent production seed for launch suppliers.
 *
 * - Targets the PRODUCTION database (.env DATABASE_URL), NOT the local dev DB.
 * - NEVER deletes suppliers/users/etc. It only upserts the seeded suppliers by
 *   slug and refreshes THEIR photos/packages. Real suppliers are untouched.
 * - Data is realistic but fictional; images are licensed Unsplash stock.
 *
 * Run:  npx tsx prisma/seed-suppliers.ts
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true }); // production Supabase connection string

import { PrismaClient, Category, PhotoType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const dbUrl = process.env.DATABASE_URL!;
const isSupabase = dbUrl.includes("supabase.com");
const adapter = new PrismaPg({
  connectionString: isSupabase
    ? dbUrl.replace(/[?&]sslmode=[^&]*/g, "").replace(/[?&]$/, "")
    : dbUrl,
  ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
});
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// ─── Verified licensed stock image pools (Unsplash IDs, HTTP 200 checked) ──────
const POOL = {
  WEDDING: [
    "1438761681033-6461ffad8d80", "1460978812857-470ed1c77af0", "1464699908537-0954e50791ee",
    "1465495976277-4387d4b0b4c6", "1472653431158-6364773b2a56", "1474552226712-ac0f0961a954",
    "1491438590914-bc09fcaaf77a", "1494790108377-be9c29b29330", "1500648767791-00dcc994a43e",
    "1501196354995-cbb51c65aaea", "1501516069922-a9982bd6f3bd", "1502635385003-ee1e6a1a742d",
    "1507003211169-0a1dd7228f2d", "1508214751196-bcfd4ca60f91", "1509927083803-4bd519298ac4",
    "1511285560929-80b456fea0bc", "1511285605577-4d62fb50d2f7", "1513279922550-250c2129b13a",
    "1518568814500-bf0f8d125f46", "1519225421980-715cb0215aed", "1519741497674-611481863552",
    "1520854221256-17451cc331bf", "1522673607200-164d1b6ce486", "1525328437458-0c4d4db7cab4",
    "1529636798458-92182e662485", "1531746020798-e6953c6e8e04", "1532712938310-34cb3982ef74",
    "1537204696486-967f1b7198c8", "1537633552985-df8429e8048b", "1544005313-94ddf0286df2",
    "1545232979-8bf68ee9b1af", "1548199973-03cce0bbc87b", "1549417229-aa67d3263c09",
    "1550005809-91ad75fb315f", "1566492031773-4f4e44671857", "1583939003579-730e3918a45a",
    "1591604466107-ec97de577aff", "1606216794074-735e91aa2c92",
  ],
  VIDEO: [
    "1485846234645-a62644f84728", "1493804714600-6edb1cd93080", "1516035069371-29a1b244cc32",
    "1579632652768-6cb9dcf85912", "1598899134739-24c46f58b8c0", "1626814026160-2237a95fc5a0",
  ],
  DJ: [
    "1429962714451-bb934ecdc4ec", "1459749411175-04bf5292ceea", "1470225620780-dba8ba36b745",
    "1470229722913-7c0e2dbbafd3", "1493225457124-a3eb161ffa5f", "1514525253161-7a46d19cd819",
    "1516450360452-9312f5e86fc7", "1533174072545-7a4b6ad7a6c3", "1598488035139-bdbb2231ce04",
  ],
  CATERING: [
    "1414235077428-338989a2e8c0", "1466978913421-dad2ebd01d17", "1467003909585-2f8a72700288",
    "1476224203421-9ac39bcb3327", "1504674900247-0877df9cc836", "1540189549336-e6e99c3679fe",
    "1555244162-803834f70033", "1555939594-58d7cb561ad1", "1565958011703-44f9829ba187",
    "1600891964092-4316c288032e",
  ],
  VENUE: [
    "1464047736614-af63643285bf", "1464366400600-7168b8af9bc3", "1470229538611-16ba8c7ffbd7",
    "1478146059778-26028b07395a", "1519167758481-83f550bb49b3", "1519741497674-611481863552",
    "1523438885200-e635ba2c371e", "1600585154340-be6161a56a0c",
  ],
  HAIR: [
    "1502823403499-6ccfcf4fb453", "1519699047748-de8e457a634e", "1522337660859-02fbefca4702",
    "1560066984-138dadb4c035", "1560869713-7d0a29430803", "1562322140-8baeececf3df",
    "1580618672591-eb180b1a973f", "1595476108010-b4d1f102b1b1",
  ],
  MAKEUP: [
    "1457972729786-0411a3b2b626", "1487412720507-e7ab37603c6f", "1503236823255-94609f598e71",
    "1512496015851-a90fb38ba796", "1516975080664-ed2fc6a32937", "1522337094846-8a818192de1f",
    "1596462502278-27bfdc403348",
  ],
  BOOTH: [
    "1492684223066-81342ee5ff30", "1514525253161-7a46d19cd819", "1516541196182-6bdb0516ed27",
    "1527529482837-4698179dc6ce", "1530103862676-de8c9debad1d", "1533174072545-7a4b6ad7a6c3",
  ],
  PRODUCER: [
    "1464366400600-7168b8af9bc3", "1470229538611-16ba8c7ffbd7", "1478146059778-26028b07395a",
    "1492684223066-81342ee5ff30", "1510076857177-7470076d4098", "1519671482749-fd09be7ccebf",
    "1533109721025-d1ae7ee7c1e1",
  ],
};

const img = (id: string, w: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

function buildPhotos(slug: string, pool: string[], offset: number) {
  const pick = (i: number) => pool[(offset + i) % pool.length];
  const spec: { id: string; type: PhotoType; w: number }[] = [
    { id: pick(0), type: PhotoType.COVER, w: 1600 },
    { id: pick(1), type: PhotoType.PROFILE, w: 400 },
    { id: pick(2), type: PhotoType.PORTFOLIO, w: 1000 },
    { id: pick(3), type: PhotoType.PORTFOLIO, w: 1000 },
    { id: pick(4), type: PhotoType.PORTFOLIO, w: 1000 },
    { id: pick(5), type: PhotoType.PORTFOLIO, w: 1000 },
  ];
  return spec.map((p, i) => ({
    cloudinaryUrl: img(p.id, p.w),
    publicId: `${slug}-${i}`,
    type: p.type,
    sortOrder: i,
  }));
}

const ALL_EVENTS = ["wedding", "bar_mitzvah", "birthday", "corporate", "other"];

type Pkg = {
  nameHe: string;
  descHe: string;
  price: number;
  hours?: number;
  includes: string[];
  isPopular?: boolean;
};

type SupplierSeed = {
  name: string;
  slug: string;
  city: string;
  areas: string[];
  events: string[];
  bioHe: string;
  from: number;
  to: number;
  rating: number;
  count: number;
  highlights: string[];
  packages: Pkg[];
};

type Group = { category: Category; pool: string[]; suppliers: SupplierSeed[] };

const GROUPS: Group[] = [
  {
    category: Category.PHOTOGRAPHER,
    pool: POOL.WEDDING,
    suppliers: [
      {
        name: "סטודיו אור לביא",
        slug: "studio-or-lavi",
        city: "תל אביב",
        areas: ["תל אביב", "גוש דן", "השרון", "מרכז"],
        events: ALL_EVENTS,
        bioHe: "סטודיו אור לביא מתמחה בצילום חתונות ואירועים בגישה דוקומנטרית ואמנותית. אנחנו לוכדים את הרגעים האמיתיים — הצחוקים, הדמעות והאהבה — עם עין לפרטים ואור טבעי. ניסיון של מעל עשור ומאות אירועים ברחבי הארץ.",
        from: 4500, to: 12000, rating: 4.9, count: 138,
        highlights: ["מעל 500 חתונות בניסיון", "אלבום יוקרה בעיצוב אישי", "משלוח תמונות תוך 21 יום"],
        packages: [
          { nameHe: "קלאסי", descHe: "מושלם לחתונה אינטימית", price: 4500, hours: 7, includes: ["צלם סטילס ראשי", "7 שעות צילום", "550 תמונות ערוכות", "גלריה דיגיטלית"], isPopular: false },
          { nameHe: "פרימיום", descHe: "הפופולרי ביותר — כיסוי מלא", price: 7500, hours: 10, includes: ["שני צלמי סטילס", "10 שעות צילום", "800 תמונות ערוכות", "אלבום 30x30", "צילומי חוץ", "USB"], isPopular: true },
          { nameHe: "לוקסus", descHe: "הכל כלול, ללא פשרות", price: 12000, hours: 12, includes: ["שני צלמים + עוזר", "12 שעות צילום", "1200 תמונות", "שני אלבומי יוקרה", "רחפן", "סשן זוגיות"], isPopular: false },
        ],
      },
      {
        name: "נועם ברקת — עדשה רכה",
        slug: "noam-barket-photography",
        city: "ירושלים",
        areas: ["ירושלים", "מרכז", "שפלה"],
        events: ALL_EVENTS,
        bioHe: "נועם ברקת, צלם חתונות ירושלמי עם עין אמנותית ולב חם. אוהב אור טבעי, רגעים ספונטניים ואנשים אמיתיים. מתמחה בחתונות בגנים, אולמות ואירועים בוטיק ברחבי ירושלים והסביבה.",
        from: 3800, to: 9500, rating: 4.8, count: 96,
        highlights: ["סגנון דוקומנטרי אותנטי", "ליווי אישי מהטאצ'אפ ועד האלבום", "המלצות חמות מזוגות"],
        packages: [
          { nameHe: "סטרטר", descHe: "לחתונה קטנה ואינטימית", price: 3800, hours: 6, includes: ["צלם ראשי", "6 שעות", "450 תמונות ערוכות", "גלריה דיגיטלית"], isPopular: false },
          { nameHe: "מלא", descHe: "כיסוי מלא ליום מושלם", price: 6500, hours: 9, includes: ["צלם ראשי + עוזר", "9 שעות", "700 תמונות", "אלבום 30x30", "USB"], isPopular: true },
        ],
      },
      {
        name: "רגעים של גלית",
        slug: "galit-moments",
        city: "חיפה",
        areas: ["חיפה", "הצפון", "השרון"],
        events: ["wedding", "bar_mitzvah", "birthday", "other"],
        bioHe: "גלית — צלמת אירועים מהצפון עם תשוקה לרגשות ולצבע. הסגנון שלי משלב אור רך, צבעים עדינים ומבט אמיתי. מאמינה שהתמונות הכי יפות הן אלה שנתפסות כשאתם פשוט אתם.",
        from: 4200, to: 9000, rating: 5.0, count: 54,
        highlights: ["דירוג מושלם מלקוחות", "מומחית לצילום אור טבעי", "זמינה גם לאירועים בצפון הרחוק"],
        packages: [
          { nameHe: "פרח", descHe: "התחלה מושלמת", price: 4200, hours: 7, includes: ["צלמת ראשית", "7 שעות", "600 תמונות ערוכות", "גלריה", "USB"], isPopular: false },
          { nameHe: "יהלום", descHe: "החבילה השלמה", price: 7800, hours: 11, includes: ["צלמת + עוזרת", "11 שעות", "1000 תמונות", "אלבום יוקרה 40x40", "פגישת הכנה", "סשן זוגיות"], isPopular: true },
        ],
      },
      {
        name: "פריים סטודיו",
        slug: "prime-studio-photography",
        city: "ראשון לציון",
        areas: ["שפלה", "גוש דן", "מרכז"],
        events: ALL_EVENTS,
        bioHe: "פריים סטודיו — צוות צלמים צעיר ואנרגטי המתמחה בצילום חתונות ואירועים במרכז ובשפלה. משלבים בין צילום מסמכי לאמנותי, עם דגש על רחבת הריקודים והרגעים הגדולים.",
        from: 3500, to: 8500, rating: 4.7, count: 112,
        highlights: ["צוות של שני צלמים בכל חבילה", "מסירת תצוגה מהירה תוך שבוע", "מחירים הוגנים ושקופים"],
        packages: [
          { nameHe: "קומפקט", descHe: "ערך מעולה", price: 3500, hours: 6, includes: ["צלם ראשי", "6 שעות", "500 תמונות", "גלריה דיגיטלית"], isPopular: false },
          { nameHe: "מושלם", descHe: "הכי נמכר", price: 5800, hours: 9, includes: ["שני צלמים", "9 שעות", "750 תמונות", "אלבום", "USB", "גלריה"], isPopular: true },
          { nameHe: "VIP", descHe: "לחתונה של החלומות", price: 8500, hours: 12, includes: ["שני צלמים + רחפן", "12 שעות", "1100 תמונות", "שני אלבומים", "סשן זוגיות"], isPopular: false },
        ],
      },
      {
        name: "יובל שגיא צילום",
        slug: "yuval-sagi-photography",
        city: "באר שבע",
        areas: ["הדרום", "שפלה", "מרכז"],
        events: ["wedding", "bar_mitzvah", "birthday", "other"],
        bioHe: "יובל שגיא — צלם חתונות מבאר שבע עם גישה חמה ואישית. מתמחה בחתונות בדרום ובמדבר, ומביא ניסיון של שנים בצילום אור נרות ורגעי לילה. כל אירוע מקבל יחס אישי ותשומת לב מלאה.",
        from: 3200, to: 7500, rating: 4.8, count: 71,
        highlights: ["מומחה לצילום מדבר וזריחה", "יחס אישי לכל זוג", "כיסוי מלא של הדרום"],
        packages: [
          { nameHe: "בסיסי", descHe: "צילום מקצועי", price: 3200, hours: 6, includes: ["צלם ראשי", "6 שעות", "450 תמונות", "גלריה", "USB"], isPopular: false },
          { nameHe: "פרימיום", descHe: "הכי פופולרי", price: 6000, hours: 10, includes: ["צלם + עוזר", "10 שעות", "850 תמונות", "אלבום יוקרה", "סשן זוגיות במדבר"], isPopular: true },
        ],
      },
    ],
  },
  {
    category: Category.VIDEOGRAPHER,
    pool: [...POOL.VIDEO, ...POOL.WEDDING],
    suppliers: [
      {
        name: "תמונה נעה — רון אלמוג",
        slug: "moving-frame-films",
        city: "תל אביב",
        areas: ["תל אביב", "גוש דן", "השרון", "מרכז"],
        events: ALL_EVENTS,
        bioHe: "תמונה נעה הוא סטודיו הפקות וידאו לחתונות ואירועים בניהול רון אלמוג. אנחנו מספרים את סיפור היום שלכם בסרט קולנועי — עם צילום 4K, מנוף ורחפן. סגנון מודרני, קצבי ומרגש.",
        from: 4000, to: 10000, rating: 4.9, count: 83,
        highlights: ["צילום 4K + רחפן", "קליפ היילייטים תוך 30 יום", "סרט חתונה מלא ומעוצב"],
        packages: [
          { nameHe: "היילייטס", descHe: "קליפ קצר ומרגש", price: 4000, hours: 8, includes: ["צלם וידאו ראשי", "8 שעות", "קליפ 5-7 דקות", "צילום 4K"], isPopular: false },
          { nameHe: "סרט מלא", descHe: "החבילה המבוקשת", price: 7000, hours: 10, includes: ["שני צלמי וידאו", "10 שעות", "סרט מלא 60 דק'", "קליפ היילייטס", "רחפן"], isPopular: true },
          { nameHe: "סינמטיק", descHe: "הפקה קולנועית מלאה", price: 10000, hours: 12, includes: ["שני צלמים + מנוף", "12 שעות", "סרט קולנועי", "רחפן", "טיזר לרשתות", "סאונד מקצועי"], isPopular: false },
        ],
      },
      {
        name: "סינמה חתונות",
        slug: "cinema-weddings",
        city: "פתח תקווה",
        areas: ["כל הארץ"],
        events: ALL_EVENTS,
        bioHe: "סינמה חתונות — צוות וידאו שמצלם בכל הארץ. אנחנו מתמחים בסרטי חתונה קולנועיים עם עריכה מוזיקלית מדויקת. מהחופה ועד הריקוד האחרון — הכל נשמר בסרט שתאהבו לצפות בו שוב ושוב.",
        from: 3500, to: 8500, rating: 4.7, count: 64,
        highlights: ["פריסה ארצית", "עריכה מוזיקלית מדויקת", "גיבוי כפול לכל החומרים"],
        packages: [
          { nameHe: "קלאסי", descHe: "סרט חתונה מלא", price: 3500, hours: 8, includes: ["צלם וידאו", "8 שעות", "סרט מלא", "קליפ קצר"], isPopular: false },
          { nameHe: "פרימיום", descHe: "וידאו + רחפן", price: 6500, hours: 10, includes: ["שני צלמים", "10 שעות", "סרט מלא", "רחפן", "קליפ היילייטס"], isPopular: true },
        ],
      },
      {
        name: "וידאו לב — נטע כרמי",
        slug: "video-lev",
        city: "ירושלים",
        areas: ["ירושלים", "מרכז", "שפלה"],
        events: ["wedding", "bar_mitzvah", "birthday", "other"],
        bioHe: "נטע כרמי — צלמת וידאו ירושלמית שמאמינה שכל אירוע הוא סיפור. אני מצלמת ברגישות וברגש, עם דגש על הרגעים הקטנים שעושים את ההבדל. מתמחה בחתונות ובני מצווה.",
        from: 3800, to: 8000, rating: 5.0, count: 41,
        highlights: ["ליווי אישי וצמוד", "סרט מרגש עם דגש על רגש", "דירוג מושלם"],
        packages: [
          { nameHe: "לב אחד", descHe: "סרט מרגש", price: 3800, hours: 8, includes: ["צלמת וידאו", "8 שעות", "סרט מלא", "קליפ"], isPopular: false },
          { nameHe: "לב מלא", descHe: "החבילה השלמה", price: 6800, hours: 10, includes: ["שתי צלמות", "10 שעות", "סרט קולנועי", "רחפן", "טיזר"], isPopular: true },
        ],
      },
      {
        name: "מסגרת אחת הפקות",
        slug: "one-frame-productions",
        city: "חיפה",
        areas: ["חיפה", "הצפון", "השרון"],
        events: ALL_EVENTS,
        bioHe: "מסגרת אחת — בית הפקה לצילום וידאו בצפון. אנחנו מביאים ציוד קולנועי, רחפן ומנוף לכל אירוע, ויוצרים סרטים שנראים כמו סרט אמיתי. ניסיון עשיר עם חתונות ואירועים גדולים.",
        from: 4200, to: 9500, rating: 4.8, count: 58,
        highlights: ["ציוד קולנועי מתקדם", "רחפן ומנוף בכל חבילה", "מומחים לאירועים גדולים"],
        packages: [
          { nameHe: "בסיס", descHe: "סרט מלא ומקצועי", price: 4200, hours: 8, includes: ["צלם וידאו", "8 שעות", "סרט מלא", "קליפ קצר"], isPopular: false },
          { nameHe: "פרימיום", descHe: "הפקה מלאה", price: 8000, hours: 11, includes: ["שני צלמים", "11 שעות", "סרט קולנועי", "רחפן", "מנוף", "טיזר"], isPopular: true },
        ],
      },
      {
        name: "סטורי פילמס",
        slug: "story-films",
        city: "אשדוד",
        areas: ["הדרום", "שפלה", "מרכז"],
        events: ["wedding", "bar_mitzvah", "birthday", "corporate"],
        bioHe: "סטורי פילמס — סטודיו וידאו צעיר מהדרום עם ראייה קולנועית מודרנית. אנחנו יוצרים סרטים דינמיים עם עריכה מהירה וקצבית, מותאמים גם לרשתות החברתיות. אוהבים אנרגיה ותנועה.",
        from: 3500, to: 8000, rating: 4.7, count: 49,
        highlights: ["עריכה מודרנית לרשתות", "טיזר תוך 72 שעות", "כיסוי מלא של הדרום"],
        packages: [
          { nameHe: "סטורי", descHe: "סרט + טיזר", price: 3500, hours: 8, includes: ["צלם וידאו", "8 שעות", "סרט מלא", "טיזר לרשתות"], isPopular: false },
          { nameHe: "בלוקבאסטר", descHe: "הפקה מלאה", price: 7000, hours: 10, includes: ["שני צלמים", "10 שעות", "סרט קולנועי", "רחפן", "טיזר", "קליפ היילייטס"], isPopular: true },
        ],
      },
    ],
  },
  {
    category: Category.PHOTO_BOOTH,
    pool: [...POOL.BOOTH, ...POOL.WEDDING.slice(0, 6)],
    suppliers: [
      {
        name: "מגנטים בקליק",
        slug: "magnets-baclick",
        city: "רמת גן",
        areas: ["גוש דן", "תל אביב", "השרון", "מרכז"],
        events: ALL_EVENTS,
        bioHe: "מגנטים בקליק — עמדת מגנטים מקצועית לחתונות ואירועים. הדפסה מיידית באיכות גבוהה, אביזרים מצחיקים ורקעים מעוצבים. האורחים שלכם יוצאים עם מזכרת שנשארת על המקרר לשנים.",
        from: 900, to: 2200, rating: 4.8, count: 127,
        highlights: ["הדפסה מיידית ללא הגבלה", "עמדת אביזרים מפוארת", "טכנאי צמוד לכל האירוע"],
        packages: [
          { nameHe: "בסיסי", descHe: "3 שעות מגנטים", price: 900, hours: 3, includes: ["עמדת מגנטים", "3 שעות", "הדפסה ללא הגבלה", "אביזרים"], isPopular: false },
          { nameHe: "מלא", descHe: "הפופולרי ביותר", price: 1500, hours: 5, includes: ["עמדת מגנטים", "5 שעות", "הדפסה ללא הגבלה", "רקע מעוצב", "אלבום למארחים"], isPopular: true },
          { nameHe: "פרימיום", descHe: "מגנטים + וידאו בות'", price: 2200, hours: 5, includes: ["עמדת מגנטים + וידאו בות'", "5 שעות", "הדפסה ללא הגבלה", "גלריה דיגיטלית", "רקע מעוצב"], isPopular: false },
        ],
      },
      {
        name: "Snap It — עידו לוי",
        slug: "snap-it-booth",
        city: "הרצליה",
        areas: ["כל הארץ"],
        events: ALL_EVENTS,
        bioHe: "Snap It מביאה את חוויית עמדת הצילום לרמה הבאה — מראת סלפי ענקית, עמדת GIF ומגנטים בעיצוב מותאם אישית. פורסים בכל הארץ ומתאימים את העיצוב למותג האירוע שלכם.",
        from: 1000, to: 2500, rating: 4.9, count: 88,
        highlights: ["מראת סלפי ענקית", "עיצוב מותאם אישית", "פריסה ארצית"],
        packages: [
          { nameHe: "מגנטים", descHe: "עמדת מגנטים קלאסית", price: 1000, hours: 4, includes: ["עמדת מגנטים", "4 שעות", "הדפסה ללא הגבלה", "אביזרים"], isPopular: false },
          { nameHe: "מראת סלפי", descHe: "החוויה המבוקשת", price: 1800, hours: 5, includes: ["מראת סלפי ענקית", "5 שעות", "הדפסה ללא הגבלה", "אנימציות", "רקע מעוצב"], isPopular: true },
        ],
      },
      {
        name: "פוטו בוקס פרו",
        slug: "photo-box-pro",
        city: "ירושלים",
        areas: ["ירושלים", "מרכז", "שפלה"],
        events: ALL_EVENTS,
        bioHe: "פוטו בוקס פרו — עמדות צילום מקצועיות לאירועים בירושלים והמרכז. אנחנו מציעים מגנטים, וידאו בות' ומראת סלפי, עם שירות אדיב וטכנאי מקצועי שדואג שהתור לא ייעצר.",
        from: 850, to: 2000, rating: 4.7, count: 64,
        highlights: ["שלוש עמדות לבחירה", "שירות מהיר ואדיב", "מחיר משתלם"],
        packages: [
          { nameHe: "מגנט", descHe: "הקלאסי", price: 850, hours: 3, includes: ["עמדת מגנטים", "3 שעות", "הדפסה ללא הגבלה", "אביזרים"], isPopular: false },
          { nameHe: "פרו", descHe: "המומלץ", price: 1450, hours: 5, includes: ["עמדת מגנטים", "5 שעות", "הדפסה ללא הגבלה", "רקע מעוצב", "גלריה דיגיטלית"], isPopular: true },
        ],
      },
      {
        name: "רגע קסום מגנטים",
        slug: "magic-moment-magnets",
        city: "חיפה",
        areas: ["חיפה", "הצפון", "השרון"],
        events: ["wedding", "bar_mitzvah", "birthday", "other"],
        bioHe: "רגע קסום — עמדת מגנטים לאירועים בצפון. אנחנו מביאים אווירה, צחוקים והמון אביזרים מצחיקים. כל אורח יוצא עם מגנט צבעוני, ואתם מקבלים אלבום עם כל התמונות מהערב.",
        from: 800, to: 1900, rating: 4.8, count: 52,
        highlights: ["המון אביזרים מצחיקים", "אלבום למארחים במתנה", "כיסוי מלא של הצפון"],
        packages: [
          { nameHe: "קסם קטן", descHe: "3 שעות", price: 800, hours: 3, includes: ["עמדת מגנטים", "3 שעות", "הדפסה ללא הגבלה", "אביזרים"], isPopular: false },
          { nameHe: "קסם גדול", descHe: "המבוקש", price: 1400, hours: 5, includes: ["עמדת מגנטים", "5 שעות", "הדפסה ללא הגבלה", "אלבום למארחים", "רקע מעוצב"], isPopular: true },
        ],
      },
      {
        name: "סמייל בוקס",
        slug: "smile-box",
        city: "אשקלון",
        areas: ["הדרום", "שפלה", "מרכז"],
        events: ALL_EVENTS,
        bioHe: "סמייל בוקס — עמדות מגנטים וסלפי לאירועים בדרום ובשפלה. שירות צעיר, מהיר וכיפי, עם ציוד חדיש ואיכות הדפסה מעולה. גורמים לכל אורח לחייך.",
        from: 850, to: 2000, rating: 4.6, count: 73,
        highlights: ["ציוד חדיש", "איכות הדפסה מעולה", "שירות זמין בדרום"],
        packages: [
          { nameHe: "סמייל", descHe: "הבסיסי", price: 850, hours: 3, includes: ["עמדת מגנטים", "3 שעות", "הדפסה ללא הגבלה", "אביזרים"], isPopular: false },
          { nameHe: "מגה סמייל", descHe: "המומלץ", price: 1500, hours: 5, includes: ["עמדת מגנטים + סלפי", "5 שעות", "הדפסה ללא הגבלה", "גלריה דיגיטלית"], isPopular: true },
        ],
      },
    ],
  },
  {
    category: Category.DJ,
    pool: POOL.DJ,
    suppliers: [
      {
        name: "DJ עידן שמש",
        slug: "dj-idan-shemesh",
        city: "תל אביב",
        areas: ["תל אביב", "גוש דן", "השרון", "מרכז"],
        events: ALL_EVENTS,
        bioHe: "DJ עידן שמש — תקליטן חתונות ואירועים עם אנרגיה שלא נגמרת. מעל 10 שנות ניסיון ומאות רחבות מפוצצות. קורא את הקהל, בונה סט מדויק ודואג שאף אחד לא יישאר בצד.",
        from: 4500, to: 9000, rating: 4.9, count: 156,
        highlights: ["מערכת סאונד ותאורה מקצועית", "קורא את הקהל בשלמות", "מעל 400 אירועים"],
        packages: [
          { nameHe: "בסיסי", descHe: "רחבה אחת", price: 4500, hours: 6, includes: ["DJ מקצועי", "מערכת סאונד", "תאורה בסיסית", "6 שעות"], isPopular: false },
          { nameHe: "מלא", descHe: "הפופולרי ביותר", price: 6500, hours: 7, includes: ["DJ מקצועי", "מערכת סאונד מתקדמת", "תאורה מלאה", "מגבר לחופה", "7 שעות"], isPopular: true },
          { nameHe: "פרימיום", descHe: "חתונת יוקרה", price: 9000, hours: 8, includes: ["DJ מוביל", "סאונד + תאורה מלאה", "מסך LED", "אפקטים מיוחדים", "מגבר לחופה", "8 שעות"], isPopular: false },
        ],
      },
      {
        name: "ביט לייב — תום כרמון",
        slug: "beat-live",
        city: "ראשון לציון",
        areas: ["כל הארץ"],
        events: ALL_EVENTS,
        bioHe: "ביט לייב בניהול תום כרמון — תקליטן שמשלב מוזיקה חיה עם סטים אלקטרוניים. מביא כנר, סקסופון או מתופף לפי הצורך, ומרים כל אירוע לרמה אחרת. פורס בכל הארץ.",
        from: 5000, to: 9500, rating: 4.8, count: 92,
        highlights: ["שילוב נגנים חיים", "סקסופון / כנר / מתופף", "אנרגיית רחבה גבוהה"],
        packages: [
          { nameHe: "DJ", descHe: "סט אלקטרוני מלא", price: 5000, hours: 6, includes: ["DJ מקצועי", "סאונד + תאורה", "6 שעות"], isPopular: false },
          { nameHe: "DJ + נגן", descHe: "המבוקש", price: 7500, hours: 7, includes: ["DJ + סקסופון/כנר", "סאונד + תאורה מלאה", "מגבר לחופה", "7 שעות"], isPopular: true },
        ],
      },
      {
        name: "סאונד מקס",
        slug: "sound-max",
        city: "ירושלים",
        areas: ["ירושלים", "מרכז", "שפלה"],
        events: ALL_EVENTS,
        bioHe: "סאונד מקס — צוות תקליטנים והגברה לאירועים בירושלים והמרכז. אנחנו מספקים DJ מנוסה, מערכת סאונד עוצמתית ותאורה, עם אופציה לחינה ולאירועים מסורתיים.",
        from: 4000, to: 8000, rating: 4.7, count: 78,
        highlights: ["מתמחים בחינה ואירועים מסורתיים", "הגברה עוצמתית", "צוות מקצועי ואמין"],
        packages: [
          { nameHe: "סטנדרט", descHe: "אירוע קלאסי", price: 4000, hours: 6, includes: ["DJ מקצועי", "סאונד", "תאורה בסיסית", "6 שעות"], isPopular: false },
          { nameHe: "מקס", descHe: "המומלץ", price: 6500, hours: 7, includes: ["DJ מקצועי", "סאונד עוצמתי", "תאורה מלאה", "מגבר לחופה", "7 שעות"], isPopular: true },
        ],
      },
      {
        name: "DJ נועה בר",
        slug: "dj-noa-bar",
        city: "חיפה",
        areas: ["חיפה", "הצפון", "השרון"],
        events: ["wedding", "bar_mitzvah", "birthday", "corporate"],
        bioHe: "DJ נועה בר — תקליטנית מהצפון עם סטייל ואוזן מוזיקלית מדויקת. מתמחה בחתונות בוטיק ובאירועי חברה. משלבת בין להיטים לבין מוזיקה איכותית שמתאימה בדיוק לקהל שלכם.",
        from: 4200, to: 8500, rating: 5.0, count: 47,
        highlights: ["תקליטנית עם סטייל ייחודי", "מומחית לאירועי בוטיק", "דירוג מושלם"],
        packages: [
          { nameHe: "בוטיק", descHe: "אירוע אינטימי", price: 4200, hours: 6, includes: ["DJ מקצועית", "סאונד + תאורה", "6 שעות"], isPopular: false },
          { nameHe: "פרימיום", descHe: "המבוקש", price: 7000, hours: 7, includes: ["DJ מקצועית", "סאונד + תאורה מלאה", "מגבר לחופה", "אפקטים", "7 שעות"], isPopular: true },
        ],
      },
      {
        name: "אלקטרו איוונטס",
        slug: "electro-events",
        city: "באר שבע",
        areas: ["הדרום", "שפלה", "מרכז"],
        events: ALL_EVENTS,
        bioHe: "אלקטרו איוונטס — חברת תקליטנים והפקות סאונד מהדרום. אנחנו מביאים אנרגיה, בס עוצמתי ותאורה מרהיבה. מתמחים בחתונות גדולות ובמסיבות שממשיכות עד הבוקר.",
        from: 3800, to: 8000, rating: 4.6, count: 84,
        highlights: ["תאורה מרהיבה ובס עוצמתי", "מתמחים בחתונות גדולות", "כיסוי מלא של הדרום"],
        packages: [
          { nameHe: "בסיסי", descHe: "רחבה סטנדרטית", price: 3800, hours: 6, includes: ["DJ מקצועי", "סאונד", "תאורה", "6 שעות"], isPopular: false },
          { nameHe: "פרימיום", descHe: "המומלץ", price: 6500, hours: 8, includes: ["DJ מקצועי", "סאונד עוצמתי", "תאורה מלאה", "עשן ואפקטים", "8 שעות"], isPopular: true },
        ],
      },
    ],
  },
  {
    category: Category.CATERING,
    pool: POOL.CATERING,
    suppliers: [
      {
        name: "שף פרטי — אבי מזור",
        slug: "chef-avi-mazor",
        city: "תל אביב",
        areas: ["כל הארץ"],
        events: ALL_EVENTS,
        bioHe: "שף אבי מזור מביא חוויה קולינרית ברמת מסעדת שף אל האירוע שלכם. תפריטים מותאמים אישית, חומרי גלם טריים ועונתיים, ושירות מלצרים מוקפד. מתמחה באירועי בוטיק וחתונות גורמה. המחירים למנה.",
        from: 280, to: 450, rating: 4.9, count: 64,
        highlights: ["תפריט שף מותאם אישית", "חומרי גלם טריים ועונתיים", "צוות מלצרים מקצועי"],
        packages: [
          { nameHe: "קלאסי", descHe: "תפריט שף למנה", price: 280, includes: ["מנות פתיחה", "מנה עיקרית לבחירה", "קינוח", "שירות מלצרים", "כלים"], isPopular: false },
          { nameHe: "גורמה", descHe: "המבוקש — תפריט מורחב", price: 360, includes: ["בופה פתיחה עשיר", "שתי מנות עיקריות", "תחנות שף", "קינוחים", "צוות מלצרים מלא"], isPopular: true },
          { nameHe: "שף פרימיום", descHe: "חוויה קולינרית מלאה", price: 450, includes: ["תחנות שף חיות", "מנות דגים ובשר", "בר קינוחים", "יין מלווה", "מלצרות יוקרה"], isPopular: false },
        ],
      },
      {
        name: "טעמים קייטרינג",
        slug: "teamim-catering",
        city: "פתח תקווה",
        areas: ["גוש דן", "השרון", "מרכז", "שפלה"],
        events: ALL_EVENTS,
        bioHe: "טעמים קייטרינג — קייטרינג לאירועים גדולים במרכז הארץ. אנחנו מתמחים בחתונות של מאות אורחים, עם תפריט עשיר, בופה מפואר ושירות מדויק. כשרות מהודרת. המחירים למנה.",
        from: 220, to: 380, rating: 4.7, count: 118,
        highlights: ["מתמחים באירועים גדולים", "כשרות מהודרת", "בופה מפואר ומגוון"],
        packages: [
          { nameHe: "בסיסי", descHe: "תפריט קלאסי למנה", price: 220, includes: ["סלטים ולחמים", "מנה עיקרית", "תוספות", "שתייה קלה", "מלצרות"], isPopular: false },
          { nameHe: "מורחב", descHe: "הפופולרי ביותר", price: 300, includes: ["בופה פתיחה עשיר", "שתי מנות עיקריות", "תחנות", "קינוחים", "מלצרות מלאה"], isPopular: true },
        ],
      },
      {
        name: "המטבח של רותם",
        slug: "rotem-kitchen",
        city: "ירושלים",
        areas: ["ירושלים", "מרכז", "שפלה"],
        events: ALL_EVENTS,
        bioHe: "המטבח של רותם — קייטרינג ביתי ואיכותי לאירועים בירושלים. אוכל שנראה ומרגיש כמו בבית, אבל ברמה של אירוע. תפריטים בשריים, חלביים וטבעוניים. כשר למהדרין. המחירים למנה.",
        from: 200, to: 350, rating: 4.8, count: 73,
        highlights: ["אוכל ביתי איכותי", "אופציות טבעוניות", "כשר למהדרין"],
        packages: [
          { nameHe: "ביתי", descHe: "תפריט ביתי למנה", price: 200, includes: ["סלטים", "מנה עיקרית", "תוספות", "מלצרות"], isPopular: false },
          { nameHe: "חגיגי", descHe: "המומלץ", price: 290, includes: ["בופה עשיר", "שתי מנות עיקריות", "קינוחים", "שתייה", "מלצרות מלאה"], isPopular: true },
        ],
      },
      {
        name: "גורמה אירועים",
        slug: "gourmet-events-catering",
        city: "חיפה",
        areas: ["חיפה", "הצפון", "השרון"],
        events: ALL_EVENTS,
        bioHe: "גורמה אירועים — קייטרינג פרימיום בצפון. אנחנו משלבים מטבח ים-תיכוני עשיר עם הגשה מוקפדת ותחנות שף חיות. מתאימים לחתונות ולאירועי חברה יוקרתיים. המחירים למנה.",
        from: 250, to: 420, rating: 4.8, count: 61,
        highlights: ["מטבח ים-תיכוני עשיר", "תחנות שף חיות", "הגשה מוקפדת"],
        packages: [
          { nameHe: "ים-תיכוני", descHe: "תפריט למנה", price: 250, includes: ["מזטים ים-תיכוניים", "מנה עיקרית", "תוספות", "מלצרות"], isPopular: false },
          { nameHe: "שף", descHe: "המבוקש", price: 350, includes: ["תחנות שף חיות", "שתי מנות עיקריות", "בר קינוחים", "מלצרות מלאה"], isPopular: true },
        ],
      },
      {
        name: "סועדים קייטרינג",
        slug: "soadim-catering",
        city: "אשדוד",
        areas: ["הדרום", "שפלה", "מרכז"],
        events: ALL_EVENTS,
        bioHe: "סועדים — קייטרינג משפחתי לאירועים בדרום. אוכל בשפע, טעמים מהבית ושירות חם. מתמחים בחתונות, בריתות ואירועים מסורתיים. מחירים הוגנים. המחירים למנה.",
        from: 180, to: 320, rating: 4.6, count: 95,
        highlights: ["אוכל בשפע וטעמים מהבית", "מחירים הוגנים", "מתמחים באירועים מסורתיים"],
        packages: [
          { nameHe: "משפחתי", descHe: "תפריט למנה", price: 180, includes: ["סלטים", "מנה עיקרית", "תוספות", "שתייה קלה"], isPopular: false },
          { nameHe: "חגיגה", descHe: "המומלץ", price: 270, includes: ["בופה עשיר", "שתי מנות עיקריות", "קינוחים", "מלצרות"], isPopular: true },
        ],
      },
    ],
  },
  {
    category: Category.VENUE,
    pool: POOL.VENUE,
    suppliers: [
      {
        name: "אחוזת הדר",
        slug: "ahuzat-hadar",
        city: "כפר סבא",
        areas: ["השרון", "גוש דן", "מרכז"],
        events: ["wedding", "bar_mitzvah", "corporate"],
        bioHe: "אחוזת הדר — גן אירועים מרהיב בלב השרון, עטוף בירק ועצי זית עתיקים. מתחם קסום לחתונות בטבע, עם אזור חופה פתוח, רחבת ריקודים ואולם חורף מפואר. המחירים למנה.",
        from: 320, to: 550, rating: 4.9, count: 87,
        highlights: ["גן פתוח עם עצי זית עתיקים", "אולם חורף מפואר", "חנייה חינם למאות רכבים"],
        packages: [
          { nameHe: "גן ופנים", descHe: "מחיר למנה — גן + אולם", price: 320, includes: ["השכרת המתחם", "תפריט מלא", "עיצוב בסיסי", "חנייה"], isPopular: false },
          { nameHe: "פרימיום", descHe: "החבילה המבוקשת", price: 440, includes: ["המתחם המלא", "תפריט שף מורחב", "בר אלכוהול", "עיצוב מוגבר", "מתאם אירוע"], isPopular: true },
          { nameHe: "יוקרה", descHe: "אירוע ללא פשרות", price: 550, includes: ["המתחם בבלעדיות", "תפריט שף פרימיום", "בר פתוח מלא", "עיצוב יוקרתי", "מתאם צמוד"], isPopular: false },
        ],
      },
      {
        name: "גן האירועים לגונה",
        slug: "laguna-garden",
        city: "ראשון לציון",
        areas: ["גוש דן", "שפלה", "מרכז"],
        events: ["wedding", "bar_mitzvah", "corporate"],
        bioHe: "לגונה — גן אירועים מודרני עם בריכת מים מרכזית ותאורה דרמטית. מתחם שמשלב אלגנטיות עם אווירת מסיבה, מושלם לחתונות עירוניות. שירות מלא מקבלת פנים ועד הריקוד האחרון. המחירים למנה.",
        from: 300, to: 500, rating: 4.7, count: 104,
        highlights: ["בריכת מים ותאורה דרמטית", "מיקום מרכזי ונגיש", "צוות שירות מנוסה"],
        packages: [
          { nameHe: "סטנדרט", descHe: "מחיר למנה", price: 300, includes: ["השכרת המתחם", "תפריט מלא", "עיצוב בסיסי", "חנייה"], isPopular: false },
          { nameHe: "פרימיום", descHe: "המומלץ", price: 420, includes: ["המתחם המלא", "תפריט מורחב", "בר אלכוהול", "עיצוב מוגבר"], isPopular: true },
        ],
      },
      {
        name: "אולמי הנסיכה",
        slug: "hanesicha-halls",
        city: "ירושלים",
        areas: ["ירושלים", "מרכז", "שפלה"],
        events: ["wedding", "bar_mitzvah", "other"],
        bioHe: "אולמי הנסיכה — אולם אירועים קלאסי ומפואר בירושלים, עם נברשות קריסטל ואולמות בגדלים שונים. כשרות מהודרת ושירות ברמה גבוהה. מתאים לחתונות מסורתיות ואירועים גדולים. המחירים למנה.",
        from: 280, to: 480, rating: 4.6, count: 132,
        highlights: ["נברשות קריסטל ואולם מפואר", "כשרות מהודרת (בד\"ץ)", "אולמות בגדלים שונים"],
        packages: [
          { nameHe: "קלאסי", descHe: "מחיר למנה", price: 280, includes: ["השכרת האולם", "תפריט מלא", "עיצוב בסיסי", "כשרות מהודרת"], isPopular: false },
          { nameHe: "מלכותי", descHe: "המבוקש", price: 400, includes: ["האולם המלא", "תפריט מורחב", "עיצוב מוגבר", "מתאם אירוע"], isPopular: true },
        ],
      },
      {
        name: "חוות הזית",
        slug: "olive-farm-venue",
        city: "כרמיאל",
        areas: ["הצפון", "חיפה"],
        events: ["wedding", "bar_mitzvah", "corporate"],
        bioHe: "חוות הזית — מתחם אירועים כפרי ומרהיב בגליל, מוקף נוף הרים וכרמי זיתים. חתונות בוטיק בטבע, עם אווירה אינטימית ותפריט מהמטבח המקומי. המחירים למנה.",
        from: 300, to: 520, rating: 4.9, count: 58,
        highlights: ["נוף הרים וכרמי זיתים", "אווירת בוטיק אינטימית", "תפריט מהמטבח הגלילי"],
        packages: [
          { nameHe: "כפרי", descHe: "מחיר למנה", price: 300, includes: ["השכרת המתחם", "תפריט גלילי", "עיצוב טבעי", "חנייה"], isPopular: false },
          { nameHe: "בוטיק", descHe: "המומלץ", price: 440, includes: ["המתחם בבלעדיות", "תפריט שף", "בר יין מקומי", "עיצוב מוגבר"], isPopular: true },
        ],
      },
      {
        name: "מרינה גארדן",
        slug: "marina-garden",
        city: "אילת",
        areas: ["אילת", "הדרום"],
        events: ["wedding", "corporate", "birthday"],
        bioHe: "מרינה גארדן — מתחם אירועים על קו המים באילת, עם נוף לים ולמרינה. חתונות יעד ואירועי חברה בקו החוף, עם שקיעה מרהיבה ואווירה קיצית. המחירים למנה.",
        from: 350, to: 550, rating: 4.8, count: 44,
        highlights: ["נוף ים ומרינה", "שקיעה מרהיבה", "מתמחים בחתונות יעד"],
        packages: [
          { nameHe: "חוף", descHe: "מחיר למנה", price: 350, includes: ["השכרת המתחם", "תפריט מלא", "עיצוב חופי", "חנייה"], isPopular: false },
          { nameHe: "פרימיום", descHe: "המבוקש", price: 490, includes: ["המתחם המלא", "תפריט שף", "בר פתוח", "עיצוב יוקרתי", "מתאם אירוע"], isPopular: true },
        ],
      },
    ],
  },
  {
    category: Category.HAIR_STYLIST,
    pool: POOL.HAIR,
    suppliers: [
      {
        name: "תסרוקות מאיה כהן",
        slug: "maya-cohen-hair",
        city: "רמת גן",
        areas: ["גוש דן", "תל אביב", "השרון", "מרכז"],
        events: ["wedding", "bar_mitzvah", "birthday"],
        bioHe: "מאיה כהן — מעצבת שיער כלות עם יד מלטפת ועין לפרטים. מתמחה בתסרוקות רומנטיות, אסופות ומראה טבעי. מגיעה עד בית הכלה ומלווה לאורך כל ההתארגנות. ניסיון של שנים במאות חתונות.",
        from: 1200, to: 3800, rating: 4.9, count: 143,
        highlights: ["הגעה עד בית הכלה", "תסרוקת ניסיון כלולה", "ליווי לאורך ההתארגנות"],
        packages: [
          { nameHe: "תסרוקת כלה", descHe: "תסרוקת ליום החתונה", price: 1200, includes: ["תסרוקת כלה", "תסרוקת ניסיון", "אביזרי שיער בסיסיים"], isPopular: false },
          { nameHe: "כלה + ליווי", descHe: "הפופולרי ביותר", price: 2200, includes: ["תסרוקת כלה", "תסרוקת ניסיון", "הגעה לבית הכלה", "ליווי + טאצ'אפ", "אביזרי שיער"], isPopular: true },
          { nameHe: "כלה + משפחה", descHe: "הכל כלול", price: 3800, includes: ["תסרוקת כלה + ניסיון", "תסרוקות לאם ולמלוות", "ליווי מלא ליום", "אביזרי שיער יוקרה"], isPopular: false },
        ],
      },
      {
        name: "שיער של חלום — ליאן",
        slug: "dream-hair-lian",
        city: "הרצליה",
        areas: ["כל הארץ"],
        events: ["wedding", "bar_mitzvah", "birthday"],
        bioHe: "ליאן — מעצבת שיער שמגיעה אליכן לכל הארץ. מתמחה בתסרוקות בוהו, גלים רכים ומראה עדין ומודרני. מאמינה שהשיער צריך להרגיש כמוך — רק בגרסה הכי יפה.",
        from: 1300, to: 4000, rating: 4.8, count: 88,
        highlights: ["פריסה ארצית", "מומחית לגלים ובוהו", "מוצרי פרימיום"],
        packages: [
          { nameHe: "תסרוקת כלה", descHe: "היום הגדול", price: 1300, includes: ["תסרוקת כלה", "תסרוקת ניסיון", "אביזרים"], isPopular: false },
          { nameHe: "פרימיום", descHe: "המבוקש", price: 2400, includes: ["תסרוקת כלה + ניסיון", "הגעה עד אלייך", "ליווי + טאצ'אפ", "אביזרי שיער"], isPopular: true },
        ],
      },
      {
        name: "סטודיו הייר בר",
        slug: "hair-bar-studio",
        city: "ירושלים",
        areas: ["ירושלים", "מרכז", "שפלה"],
        events: ["wedding", "bar_mitzvah", "birthday"],
        bioHe: "הייר בר — סטודיו לעיצוב שיער כלות בירושלים. צוות מעצבות מנוסות שמתמחה בתסרוקות אסופות, קלועות ומראה קלאסי אלגנטי. אפשר להתארגן בסטודיו או להזמין הגעה.",
        from: 1200, to: 3500, rating: 4.7, count: 76,
        highlights: ["צוות מעצבות מנוסה", "התארגנות בסטודיו או בבית", "מתמחות בקלוע ואסוף"],
        packages: [
          { nameHe: "בסטודיו", descHe: "התארגנות אצלנו", price: 1200, includes: ["תסרוקת כלה", "תסרוקת ניסיון", "אביזרים"], isPopular: false },
          { nameHe: "עד הבית", descHe: "המומלץ", price: 2200, includes: ["תסרוקת כלה + ניסיון", "הגעה לבית הכלה", "ליווי + טאצ'אפ"], isPopular: true },
        ],
      },
      {
        name: "עדן מעצבת שיער",
        slug: "eden-hair-design",
        city: "חיפה",
        areas: ["חיפה", "הצפון", "השרון"],
        events: ["wedding", "bar_mitzvah", "birthday"],
        bioHe: "עדן — מעצבת שיער כלות מהצפון עם סטייל עכשווי. מתמחה בתסרוקות טבעיות, פרועות בכיף וגלים רומנטיים. מגיעה עד בית הכלה בכל הצפון ומלווה בסבלנות ובחיוך.",
        from: 1250, to: 3600, rating: 4.9, count: 62,
        highlights: ["סטייל טבעי ועכשווי", "הגעה בכל הצפון", "ליווי סבלני ואישי"],
        packages: [
          { nameHe: "תסרוקת כלה", descHe: "היום שלך", price: 1250, includes: ["תסרוקת כלה", "תסרוקת ניסיון", "אביזרים"], isPopular: false },
          { nameHe: "מלא", descHe: "המבוקש", price: 2300, includes: ["תסרוקת כלה + ניסיון", "הגעה לבית הכלה", "ליווי + טאצ'אפ", "אביזרי שיער"], isPopular: true },
        ],
      },
      {
        name: "רויאל הייר",
        slug: "royal-hair",
        city: "אשדוד",
        areas: ["הדרום", "שפלה", "מרכז"],
        events: ["wedding", "bar_mitzvah", "birthday"],
        bioHe: "רויאל הייר — עיצוב שיער כלות בדרום. אנחנו מתמחות בתסרוקות זוהרות ומרשימות, אסופות גבוהות ומראה מלכותי. שירות אישי, מקצועי ובמחיר הוגן. מגיעות עד בית הכלה.",
        from: 1200, to: 3500, rating: 4.7, count: 81,
        highlights: ["מראה מלכותי וזוהר", "מחיר הוגן", "הגעה עד בית הכלה בדרום"],
        packages: [
          { nameHe: "תסרוקת כלה", descHe: "היום הגדול", price: 1200, includes: ["תסרוקת כלה", "תסרוקת ניסיון", "אביזרים"], isPopular: false },
          { nameHe: "רויאל", descHe: "המומלץ", price: 2200, includes: ["תסרוקת כלה + ניסיון", "הגעה לבית הכלה", "ליווי + טאצ'אפ", "אביזרי שיער"], isPopular: true },
        ],
      },
    ],
  },
  {
    category: Category.MAKEUP_ARTIST,
    pool: POOL.MAKEUP,
    suppliers: [
      {
        name: "איפור — שני רז",
        slug: "shani-raz-makeup",
        city: "תל אביב",
        areas: ["תל אביב", "גוש דן", "השרון", "מרכז"],
        events: ["wedding", "bar_mitzvah", "birthday"],
        bioHe: "שני רז — מאפרת כלות עם מבט אמנותי וסטייל נקי. מתמחה באיפור טבעי-זוהר שמחזיק לאורך כל היום. משתמשת במוצרי פרימיום ומגיעה עד בית הכלה. איפור ניסיון תמיד כלול.",
        from: 1200, to: 3800, rating: 4.9, count: 151,
        highlights: ["איפור עמיד לאורך כל היום", "מוצרי פרימיום בלבד", "איפור ניסיון כלול"],
        packages: [
          { nameHe: "איפור כלה", descHe: "היום הגדול", price: 1200, includes: ["איפור כלה", "איפור ניסיון", "ריסים"], isPopular: false },
          { nameHe: "כלה + ליווי", descHe: "הפופולרי ביותר", price: 2200, includes: ["איפור כלה", "איפור ניסיון", "הגעה לבית הכלה", "ליווי + טאצ'אפ", "ריסים"], isPopular: true },
          { nameHe: "כלה + משפחה", descHe: "הכל כלול", price: 3800, includes: ["איפור כלה + ניסיון", "איפור לאם ולמלוות", "ליווי מלא ליום", "ריסים לכולן"], isPopular: false },
        ],
      },
      {
        name: "לוק מושלם — טל אביב",
        slug: "perfect-look-tal",
        city: "ראשון לציון",
        areas: ["כל הארץ"],
        events: ["wedding", "bar_mitzvah", "birthday"],
        bioHe: "טל אביב — מאפרת שמגיעה אליכן בכל הארץ. מתמחה באיפור רך ורומנטי ובאיפור ערב מודגש. מתאימה את הלוק לפנים, לשמלה ולאווירה שלכן, עם המון סבלנות ואהבה.",
        from: 1300, to: 4000, rating: 4.8, count: 94,
        highlights: ["פריסה ארצית", "התאמת לוק אישית", "מומחית לאיפור רך ורומנטי"],
        packages: [
          { nameHe: "איפור כלה", descHe: "היום שלך", price: 1300, includes: ["איפור כלה", "איפור ניסיון", "ריסים"], isPopular: false },
          { nameHe: "פרימיום", descHe: "המבוקש", price: 2400, includes: ["איפור כלה + ניסיון", "הגעה עד אלייך", "ליווי + טאצ'אפ", "ריסים"], isPopular: true },
        ],
      },
      {
        name: "סטודיו גלאם",
        slug: "glam-studio",
        city: "ירושלים",
        areas: ["ירושלים", "מרכז", "שפלה"],
        events: ["wedding", "bar_mitzvah", "birthday"],
        bioHe: "סטודיו גלאם — סטודיו איפור כלות בירושלים. אנחנו מתמחות באיפור זוהר ומודגש ובמראה גלאם קלאסי. אפשר להתארגן בסטודיו המעוצב שלנו או להזמין הגעה עד הבית.",
        from: 1200, to: 3500, rating: 4.7, count: 79,
        highlights: ["מראה גלאם זוהר", "סטודיו מעוצב", "אופציה להגעה עד הבית"],
        packages: [
          { nameHe: "בסטודיו", descHe: "התארגנות אצלנו", price: 1200, includes: ["איפור כלה", "איפור ניסיון", "ריסים"], isPopular: false },
          { nameHe: "עד הבית", descHe: "המומלץ", price: 2200, includes: ["איפור כלה + ניסיון", "הגעה לבית הכלה", "ליווי + טאצ'אפ", "ריסים"], isPopular: true },
        ],
      },
      {
        name: "מאפרת אור לוי",
        slug: "or-levi-makeup",
        city: "חיפה",
        areas: ["חיפה", "הצפון", "השרון"],
        events: ["wedding", "bar_mitzvah", "birthday"],
        bioHe: "אור לוי — מאפרת כלות מהצפון עם יד עדינה וסטייל טבעי. מתמחה באיפור שמדגיש את היופי הטבעי מבלי להסתיר. מגיעה עד בית הכלה בכל הצפון ומלווה עד היציאה לחופה.",
        from: 1250, to: 3600, rating: 4.9, count: 67,
        highlights: ["איפור טבעי שמדגיש יופי", "הגעה בכל הצפון", "ליווי עד החופה"],
        packages: [
          { nameHe: "איפור כלה", descHe: "היום הגדול", price: 1250, includes: ["איפור כלה", "איפור ניסיון", "ריסים"], isPopular: false },
          { nameHe: "מלא", descHe: "המבוקש", price: 2300, includes: ["איפור כלה + ניסיון", "הגעה לבית הכלה", "ליווי + טאצ'אפ", "ריסים"], isPopular: true },
        ],
      },
      {
        name: "ביוטי בר",
        slug: "beauty-bar-makeup",
        city: "אשקלון",
        areas: ["הדרום", "שפלה", "מרכז"],
        events: ["wedding", "bar_mitzvah", "birthday"],
        bioHe: "ביוטי בר — איפור כלות ואירועים בדרום. מתמחות באיפור מודגש וזוהר שנראה מושלם גם בתמונות. שירות אישי, מוצרים איכותיים ומחיר הוגן. מגיעות עד בית הכלה.",
        from: 1200, to: 3500, rating: 4.6, count: 88,
        highlights: ["איפור שמצטלם מושלם", "מוצרים איכותיים", "מחיר הוגן בדרום"],
        packages: [
          { nameHe: "איפור כלה", descHe: "היום שלך", price: 1200, includes: ["איפור כלה", "איפור ניסיון", "ריסים"], isPopular: false },
          { nameHe: "פרימיום", descHe: "המומלץ", price: 2200, includes: ["איפור כלה + ניסיון", "הגעה לבית הכלה", "ליווי + טאצ'אפ", "ריסים"], isPopular: true },
        ],
      },
    ],
  },
  {
    category: Category.EVENT_PRODUCER,
    pool: POOL.PRODUCER,
    suppliers: [
      {
        name: "הפקות אייל שחר",
        slug: "eyal-shahar-productions",
        city: "תל אביב",
        areas: ["כל הארץ"],
        events: ALL_EVENTS,
        bioHe: "אייל שחר — מפיק אירועים עם ניסיון של מעל 15 שנה בהפקת חתונות ואירועי חברה. מנהל עבורכם את כל הספקים, לוחות הזמנים והלוגיסטיקה, כדי שתוכלו פשוט ליהנות מהיום שלכם. הפקה מקצה לקצה.",
        from: 6000, to: 15000, rating: 4.9, count: 52,
        highlights: ["ניהול מלא של כל הספקים", "מעל 15 שנות ניסיון", "מנהל אירוע צמוד ביום עצמו"],
        packages: [
          { nameHe: "ליווי", descHe: "ייעוץ וליווי לתכנון", price: 6000, includes: ["פגישות תכנון", "המלצה על ספקים", "ניהול לוחות זמנים", "ליווי עד האירוע"], isPopular: false },
          { nameHe: "הפקה מלאה", descHe: "המבוקש — מקצה לקצה", price: 10000, includes: ["ניהול כל הספקים", "תכנון ועיצוב", "ניהול תקציב", "מנהל אירוע ביום עצמו", "צוות הפקה"], isPopular: true },
          { nameHe: "פרימיום", descHe: "הפקת יוקרה", price: 15000, includes: ["הפקה מלאה", "מעצב אירוע צמוד", "ניהול VIP", "צוות הפקה מורחב", "חזרה כללית"], isPopular: false },
        ],
      },
      {
        name: "סידורי הושבה פלוס",
        slug: "seating-plus",
        city: "פתח תקווה",
        areas: ["גוש דן", "השרון", "מרכז", "שפלה"],
        events: ["wedding", "bar_mitzvah", "corporate"],
        bioHe: "הושבה פלוס — שירות סידורי הושבה ואיזור אורחים לחתונות ואירועים גדולים. אנחנו בונים עבורכם את מפת ההושבה, מנהלים אישורי הגעה ודואגים שכל אורח ימצא את מקומו בקלות.",
        from: 2000, to: 6000, rating: 4.7, count: 96,
        highlights: ["ניהול אישורי הגעה מלא", "מפת הושבה דיגיטלית", "צוות קבלה ביום האירוע"],
        packages: [
          { nameHe: "הושבה", descHe: "מפת הושבה + אישורי הגעה", price: 2000, includes: ["ניהול אישורי הגעה", "מפת הושבה דיגיטלית", "תיאום מול האולם"], isPopular: false },
          { nameHe: "הושבה + קבלה", descHe: "המומלץ", price: 4000, includes: ["ניהול אישורי הגעה", "מפת הושבה", "צוות קבלה ביום האירוע", "שילוט שולחנות"], isPopular: true },
        ],
      },
      {
        name: "אירוע מושלם — דנה גל",
        slug: "perfect-event-dana",
        city: "ירושלים",
        areas: ["ירושלים", "מרכז", "שפלה"],
        events: ALL_EVENTS,
        bioHe: "דנה גל — מפיקה ומעצבת אירועים בירושלים. משלבת בין הפקה מדויקת לעיצוב קפדני, ויוצרת אירועים עם חתימה אישית ואווירה בלתי נשכחת. מלווה זוגות מהרעיון ועד הרגע האחרון.",
        from: 5000, to: 13000, rating: 5.0, count: 38,
        highlights: ["הפקה + עיצוב במקום אחד", "חתימה עיצובית אישית", "דירוג מושלם מלקוחות"],
        packages: [
          { nameHe: "ליווי ועיצוב", descHe: "תכנון וקונספט", price: 5000, includes: ["פגישות תכנון", "קונספט עיצובי", "המלצה על ספקים", "ליווי עד האירוע"], isPopular: false },
          { nameHe: "הפקה מלאה", descHe: "המבוקש", price: 9500, includes: ["ניהול כל הספקים", "עיצוב מלא", "ניהול תקציב", "מנהלת אירוע ביום עצמו"], isPopular: true },
        ],
      },
      {
        name: "מפיקים בצפון",
        slug: "north-producers",
        city: "חיפה",
        areas: ["חיפה", "הצפון", "השרון"],
        events: ALL_EVENTS,
        bioHe: "מפיקים בצפון — צוות הפקת אירועים שמכיר כל מתחם ואולם בצפון. אנחנו דואגים לכל פרט — מספקים ועד לוגיסטיקה — ומרימים אירועים חלקים וללא דאגות ברחבי הגליל והקריות.",
        from: 4500, to: 12000, rating: 4.8, count: 49,
        highlights: ["היכרות עם כל מתחמי הצפון", "ניהול לוגיסטי מלא", "מנהל אירוע צמוד"],
        packages: [
          { nameHe: "ליווי", descHe: "ייעוץ וליווי", price: 4500, includes: ["פגישות תכנון", "המלצה על ספקים", "ניהול לוחות זמנים"], isPopular: false },
          { nameHe: "הפקה מלאה", descHe: "המומלץ", price: 9000, includes: ["ניהול כל הספקים", "תכנון ועיצוב", "ניהול תקציב", "מנהל אירוע ביום עצמו"], isPopular: true },
        ],
      },
      {
        name: "סטייל איוונטס",
        slug: "style-events-producers",
        city: "באר שבע",
        areas: ["הדרום", "שפלה", "מרכז"],
        events: ALL_EVENTS,
        bioHe: "סטייל איוונטס — חברת הפקה ועיצוב אירועים מהדרום. צוות צעיר ויצירתי שמתמחה בקונספטים מקוריים, עיצוב שולחנות ואווירה. הופכים כל אירוע לחוויה מעוצבת ומדויקת.",
        from: 4000, to: 11000, rating: 4.7, count: 55,
        highlights: ["קונספטים מקוריים ויצירתיים", "עיצוב שולחנות ואווירה", "כיסוי מלא של הדרום"],
        packages: [
          { nameHe: "עיצוב", descHe: "עיצוב וקונספט", price: 4000, includes: ["קונספט עיצובי", "עיצוב שולחנות", "אלמנטים דקורטיביים"], isPopular: false },
          { nameHe: "הפקה + עיצוב", descHe: "המבוקש", price: 8500, includes: ["ניהול ספקים", "עיצוב מלא", "ניהול תקציב", "מנהל אירוע ביום עצמו"], isPopular: true },
        ],
      },
    ],
  },
];

// ─── Runner ────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding launch suppliers (additive, production)...");
  let phoneIdx = 0;
  let created = 0;

  for (const group of GROUPS) {
    for (let i = 0; i < group.suppliers.length; i++) {
      const s = group.suppliers[i];
      phoneIdx++;
      const phone = `0500000${String(phoneIdx).padStart(3, "0")}`; // reserved 050-000-0xxx block
      const data = {
        name: s.name,
        slug: s.slug,
        phone,
        email: `${s.slug}@suppliers.topeventer.co.il`,
        category: group.category,
        bioHe: s.bioHe,
        city: s.city,
        serviceAreas: s.areas,
        supportedEventTypes: s.events,
        basePriceFrom: s.from,
        basePriceTo: s.to,
        ratingAvg: s.rating,
        ratingCount: s.count,
        isVerified: true,
        isActive: true,
        responseRate: 0.9 + Math.random() * 0.09,
        highlights: s.highlights,
      };

      const supplier = await prisma.supplier.upsert({
        where: { slug: s.slug },
        update: data,
        create: data,
      });

      // Idempotent refresh of THIS supplier's photos/packages only.
      await prisma.supplierPhoto.deleteMany({ where: { supplierId: supplier.id } });
      await prisma.supplierPackage.deleteMany({ where: { supplierId: supplier.id } });

      const photos = buildPhotos(s.slug, group.pool, i * 3);
      await prisma.supplierPhoto.createMany({
        data: photos.map((p) => ({ ...p, supplierId: supplier.id })),
      });

      for (const pkg of s.packages) {
        await prisma.supplierPackage.create({
          data: {
            supplierId: supplier.id,
            nameHe: pkg.nameHe,
            descHe: pkg.descHe,
            price: pkg.price,
            hours: pkg.hours ?? null,
            includes: pkg.includes,
            isPopular: pkg.isPopular ?? false,
          },
        });
      }

      created++;
      console.log(`  ✓ ${group.category} — ${s.name} (${s.slug})`);
    }
  }

  console.log(`\n✅ Done. Upserted ${created} suppliers across ${GROUPS.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
