import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient, Category, PhotoType, AvailabilitySource } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const SUPPLIERS = [
  {
    name: "דנה כהן",
    phone: "0521234001",
    email: "dana@example.com",
    slug: "dana-cohen",
    city: "תל אביב",
    serviceAreas: ["גוש דן", "תל אביב", "השרון"],
    bioHe: `אני דנה, צלמת חתונות ורגעים עם ניסיון של 8 שנים. הסגנון שלי הוא דוקומנטרי — אני מלכדת את הרגעים האמיתיים, הצחוקים, הדמעות והאהבה. אני מאמינה שכל חתונה היא סיפור ייחודי, ואני כאן כדי לספר אותו בצורה הכי יפה שיש.

עבדתי ב-400+ חתונות ברחבי הארץ, ויש לי ניסיון עשיר עם חתונות בחוץ, אולמות ואירועים אינטימיים כאחד.`,
    basePriceFrom: 3500,
    basePriceTo: 8000,
    ratingAvg: 4.9,
    ratingCount: 127,
    isVerified: true,
    isActive: true,
    packages: [
      {
        nameHe: "בסיסי",
        descHe: "מושלם לחתונה אינטימית",
        price: 3500,
        hours: 6,
        includes: ["6 שעות צילום", "500 תמונות ערוכות", "גלריה דיגיטלית", "משלוח תוך 30 יום"],
        isPopular: false,
      },
      {
        nameHe: "מושלם",
        descHe: "הפופולרי ביותר — כיסוי מלא",
        price: 5500,
        hours: 10,
        includes: ["10 שעות צילום", "800 תמונות ערוכות", "גלריה דיגיטלית", "אלבום 30x30 ס\"מ", "משלוח תוך 21 יום", "USB עם כל התמונות"],
        isPopular: true,
      },
      {
        nameHe: "פרימיום",
        descHe: "הכל כלול, ללא פשרות",
        price: 8000,
        hours: 12,
        includes: ["12 שעות צילום", "1200 תמונות ערוכות", "שני אלבומים 40x40", "גלריה דיגיטלית", "USB + הדפסות", "משלוח תוך 14 יום", "ספר אורחים דיגיטלי"],
        isPopular: false,
      },
    ],
    photos: [
      { url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800", type: PhotoType.COVER },
      { url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400", type: PhotoType.PROFILE },
      { url: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1509927083803-4bd519298ac4?w=800", type: PhotoType.PORTFOLIO },
    ],
  },
  {
    name: "מיכל לוי",
    phone: "0521234002",
    email: "michal@example.com",
    slug: "michal-levy",
    city: "ירושלים",
    serviceAreas: ["ירושלים", "מרכז", "שפלה"],
    bioHe: `מיכל לוי — צלמת חתונות ירושלמית עם לב גדול ועין אמנותית. 6 שנים של ניסיון, מאות חתונות שצולמו. אוהבת אור טבעי, רגעים ספונטניים ואנשים אמיתיים.

מתמחה בחתונות בירושלים — בפנים ובחוץ, בגנים ובאולמות. כל תמונה היא יצירת אמנות.`,
    basePriceFrom: 2800,
    basePriceTo: 6500,
    ratingAvg: 4.8,
    ratingCount: 89,
    isVerified: true,
    isActive: true,
    packages: [
      {
        nameHe: "סטרטר",
        descHe: "לחתונה קטנה ואינטימית",
        price: 2800,
        hours: 5,
        includes: ["5 שעות צילום", "400 תמונות ערוכות", "גלריה דיגיטלית"],
        isPopular: false,
      },
      {
        nameHe: "קלאסי",
        descHe: "כיסוי מלא ליום מושלם",
        price: 4500,
        hours: 9,
        includes: ["9 שעות צילום", "700 תמונות ערוכות", "גלריה דיגיטלית", "USB", "אלבום 30x30"],
        isPopular: true,
      },
    ],
    photos: [
      { url: "https://images.unsplash.com/photo-1525328437458-0c4d4db7cab4?w=800", type: PhotoType.COVER },
      { url: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400", type: PhotoType.PROFILE },
      { url: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800", type: PhotoType.PORTFOLIO },
    ],
  },
  {
    name: "שירה אברהם",
    phone: "0521234003",
    email: "shira@example.com",
    slug: "shira-avraham",
    city: "חיפה",
    serviceAreas: ["חיפה", "הצפון", "השרון"],
    bioHe: `שירה אברהם — אמנית ויזואלית וצלמת חתונות מחיפה. 5 שנים בתחום, 200+ חתונות. הסגנון שלי: אור רך, צבעים עדינים, רגשות עמוקים.

מאמינה שהתמונות הכי יפות הן אלה שאתם לא יודעים שצולמו — כשאתם פשוט אתם.`,
    basePriceFrom: 4200,
    basePriceTo: 9000,
    ratingAvg: 5.0,
    ratingCount: 43,
    isVerified: true,
    isActive: true,
    packages: [
      {
        nameHe: "פרח",
        descHe: "התחלה מושלמת",
        price: 4200,
        hours: 7,
        includes: ["7 שעות צילום", "600 תמונות ערוכות", "גלריה דיגיטלית", "USB"],
        isPopular: false,
      },
      {
        nameHe: "יהלום",
        descHe: "הכל שאאפשר לתת",
        price: 7500,
        hours: 11,
        includes: ["11 שעות צילום", "1000 תמונות ערוכות", "אלבום יוקרה 40x40", "USB", "גלריה", "פגישת הכנה"],
        isPopular: true,
      },
    ],
    photos: [
      { url: "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=800", type: PhotoType.COVER },
      { url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400", type: PhotoType.PROFILE },
      { url: "https://images.unsplash.com/photo-1549417229-aa67d3263c09?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1459213502238-d8e5e4d3498b?w=800", type: PhotoType.PORTFOLIO },
    ],
  },
  {
    name: "נועה גולן",
    phone: "0521234004",
    email: "noa@example.com",
    slug: "noa-golan",
    city: "הרצליה",
    serviceAreas: ["גוש דן", "השרון", "תל אביב"],
    bioHe: `נועה גולן, צלמת מהרצליה עם 7 שנים בתחום. מתמחה בחתונות בוטיק — קטנות, אינטימיות ומיוחדות. האסתטיקה שלי: נקייה, אורגנית, רגשית.

עבדתי עם כלות מכל העולם שבאו לחגוג בישראל. מדברת אנגלית, ספרדית ועברית.`,
    basePriceFrom: 3100,
    basePriceTo: 7000,
    ratingAvg: 4.7,
    ratingCount: 156,
    isVerified: true,
    isActive: true,
    packages: [
      {
        nameHe: "בסיסי",
        descHe: "מצוין לאירועים אינטימיים",
        price: 3100,
        hours: 6,
        includes: ["6 שעות", "500 תמונות", "גלריה דיגיטלית"],
        isPopular: false,
      },
      {
        nameHe: "מלא",
        descHe: "הנפוץ ביותר",
        price: 5200,
        hours: 10,
        includes: ["10 שעות", "750 תמונות", "אלבום", "USB", "גלריה"],
        isPopular: true,
      },
      {
        nameHe: "VIP",
        descHe: "לחתונה של החלומות",
        price: 7000,
        hours: 12,
        includes: ["12 שעות", "1000 תמונות", "2 אלבומים", "USB", "גלריה", "וידאו highlight קצר"],
        isPopular: false,
      },
    ],
    photos: [
      { url: "https://images.unsplash.com/photo-1510904144228-93a23b42fa76?w=800", type: PhotoType.COVER },
      { url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400", type: PhotoType.PROFILE },
      { url: "https://images.unsplash.com/photo-1513279922550-250c2129b13a?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1501516069922-a9982bd6f3bd?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800", type: PhotoType.PORTFOLIO },
    ],
  },
  {
    name: "טל שפירא",
    phone: "0521234005",
    email: "tal@example.com",
    slug: "tal-shapira",
    city: "ראשון לציון",
    serviceAreas: ["גוש דן", "שפלה", "מרכז"],
    bioHe: `טל שפירא — צלמת חתונות מראשון לציון. הסגנון שלי משלב בין צילום מסמכי לאמנותי. כל חתונה היא עולם ומלואו, ואני כאן כדי לתפוס כל רגע.`,
    basePriceFrom: 2500,
    basePriceTo: 5500,
    ratingAvg: 4.9,
    ratingCount: 67,
    isVerified: true,
    isActive: true,
    packages: [
      {
        nameHe: "קומפקט",
        descHe: "ערך מעולה",
        price: 2500,
        hours: 6,
        includes: ["6 שעות", "400 תמונות", "גלריה"],
        isPopular: false,
      },
      {
        nameHe: "מושלם",
        descHe: "הכל שצריך",
        price: 4200,
        hours: 9,
        includes: ["9 שעות", "650 תמונות", "אלבום", "USB", "גלריה"],
        isPopular: true,
      },
    ],
    photos: [
      { url: "https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=800", type: PhotoType.COVER },
      { url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400", type: PhotoType.PROFILE },
      { url: "https://images.unsplash.com/photo-1468499503682-b42f4a8b4e21?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1524824267900-2b9f9b536098?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1464699908537-0954e50791ee?w=800", type: PhotoType.PORTFOLIO },
    ],
  },
  {
    name: "אורן דיין",
    phone: "0521234006",
    email: "oren@example.com",
    slug: "oren-dayan",
    city: "כפר סבא",
    serviceAreas: ["השרון", "גוש דן", "הצפון"],
    bioHe: `אורן דיין — צלם חתונות מכפר סבא. גיבור רגש, חובב תמונות שמספרות סיפורים. 9 שנים בתחום, 350+ חתונות. מתמחה בצילום לילה ואור נרות.`,
    basePriceFrom: 3800,
    basePriceTo: 8500,
    ratingAvg: 4.8,
    ratingCount: 34,
    isVerified: true,
    isActive: true,
    packages: [
      {
        nameHe: "בסיסי",
        descHe: "צילום מקצועי",
        price: 3800,
        hours: 7,
        includes: ["7 שעות", "550 תמונות", "גלריה", "USB"],
        isPopular: false,
      },
      {
        nameHe: "פרמיום",
        descHe: "הכי פופולרי אצלי",
        price: 6500,
        hours: 11,
        includes: ["11 שעות", "900 תמונות", "אלבום יוקרה", "USB", "גלריה", "סשן צילום זוגי"],
        isPopular: true,
      },
    ],
    photos: [
      { url: "https://images.unsplash.com/photo-1519657549108-1b26cab3f46e?w=800", type: PhotoType.COVER },
      { url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400", type: PhotoType.PROFILE },
      { url: "https://images.unsplash.com/photo-1529637003888-b7c76ea91e1c?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1511285605577-4d62fb50d2f7?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1472653431158-6364773b2a56?w=800", type: PhotoType.PORTFOLIO },
    ],
  },
  {
    name: "רחל בן דוד",
    phone: "0521234007",
    email: "rachel@example.com",
    slug: "rachel-ben-david",
    city: "באר שבע",
    serviceAreas: ["הדרום", "מרכז"],
    bioHe: `רחל בן דוד מבאר שבע. צלמת חתונות עם גישה חמה ואישית. מאמינה שכל כלה ראויה לתמונות שתראה בהן את עצמה הכי יפה שיש.`,
    basePriceFrom: 2200,
    basePriceTo: 5000,
    ratingAvg: 4.6,
    ratingCount: 78,
    isVerified: true,
    isActive: true,
    packages: [
      {
        nameHe: "ברונזה",
        descHe: "מחיר משתלם",
        price: 2200,
        hours: 5,
        includes: ["5 שעות", "350 תמונות", "גלריה"],
        isPopular: false,
      },
      {
        nameHe: "זהב",
        descHe: "המוצר הנמכר ביותר",
        price: 3800,
        hours: 8,
        includes: ["8 שעות", "600 תמונות", "אלבום", "USB", "גלריה"],
        isPopular: true,
      },
    ],
    photos: [
      { url: "https://images.unsplash.com/photo-1537204696486-967f1b7198c8?w=800", type: PhotoType.COVER },
      { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400", type: PhotoType.PROFILE },
      { url: "https://images.unsplash.com/photo-1519657549108-1b26cab3f46e?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1510904144228-93a23b42fa76?w=800", type: PhotoType.PORTFOLIO },
    ],
  },
  {
    name: "יעל מזרחי",
    phone: "0521234008",
    email: "yael@example.com",
    slug: "yael-mizrahi",
    city: "נתניה",
    serviceAreas: ["השרון", "גוש דן"],
    bioHe: `יעל מזרחי — צלמת אמנותית מנתניה. הסגנון שלי: צבעי פסטל, אור שמש, רגעים ופנטסטיים. חיה ונושמת צילום.`,
    basePriceFrom: 3200,
    basePriceTo: 7500,
    ratingAvg: 4.9,
    ratingCount: 52,
    isVerified: true,
    isActive: true,
    packages: [
      {
        nameHe: "קלאסי",
        descHe: "בסיס מעולה",
        price: 3200,
        hours: 7,
        includes: ["7 שעות", "500 תמונות", "גלריה", "USB"],
        isPopular: false,
      },
      {
        nameHe: "אמנותי",
        descHe: "הפופולרי ביותר",
        price: 5800,
        hours: 10,
        includes: ["10 שעות", "800 תמונות", "אלבום", "USB", "גלריה", "פגישת הכנה"],
        isPopular: true,
      },
    ],
    photos: [
      { url: "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?w=800", type: PhotoType.COVER },
      { url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400", type: PhotoType.PROFILE },
      { url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800", type: PhotoType.PORTFOLIO },
      { url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800", type: PhotoType.PORTFOLIO },
    ],
  },
];

const REVIEW_TEXTS = [
  "דנה הייתה פשוט מדהימה! התמונות יצאו כמו חלום. כל רגע תועד בצורה המושלמת ביותר. ממש המלצה חמה!",
  "מקצועיות ברמה אחרת. הגיעה מוכנה, ידעה את המקום, וקיבלה את כל הרגעים הכי טובים. תודה רבה!",
  "כבר ראיתי הרבה צלמות חתונה, אבל ברמה הזו עוד לא. התמונות יצאו מדהימות ואנחנו לא מפסיקים להסתכל בהן.",
  "הייתה כיף לעבוד איתה. גרמה לנו להרגיש בנוח, והתמונות מבטאות בדיוק את מה שרצינו.",
  "שירות מדהים מתחילת ועד סוף. המחיר שווה כל שקל. נמליץ לכל חברה שלנו!",
  "תמונות שכל פעם שאני רואה אותן אני בוכה מאושר. כל רגע תועד בצורה המושלמת.",
  "היית חלק ממשפחה שלנו ביום הזה. תודה על כל הרגעים שלכדת. אנחנו אוהבים אותך!",
];

const REVIEWER_NAMES = ["שרה כ.", "רחל מ.", "מורן ל.", "ליאת ש.", "תמר ב.", "אורית ג.", "נעמה פ.", "רוני ד.", "שני א.", "הילה ר."];

async function generateAvailability(supplierId: string) {
  const today = new Date();
  const slots = [];

  // Generate blocked slots for next 3 months
  for (let daysAhead = 0; daysAhead < 90; daysAhead++) {
    const date = new Date(today);
    date.setDate(today.getDate() + daysAhead);
    const dayOfWeek = date.getDay();

    // Block ~30% of days randomly, plus all Saturdays
    if (dayOfWeek === 6 || Math.random() < 0.25) {
      slots.push({
        supplierId,
        date,
        startTime: "10:00",
        endTime: "22:00",
        isBlocked: true,
        source: AvailabilitySource.MANUAL,
      });
    }
  }

  return slots;
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up
  await prisma.review.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.savedSupplier.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.supplierPackage.deleteMany();
  await prisma.supplierPhoto.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.notification.deleteMany();

  console.log("  ✓ Cleaned old data");

  // Create test customer
  const testCustomer = await prisma.user.create({
    data: {
      phone: "0501234567",
      name: "שרה כהן",
      email: "sarah@test.com",
      weddingDate: new Date("2026-09-15"),
      weddingArea: "תל אביב",
      weddingAreaLat: 32.0853,
      weddingAreaLng: 34.7818,
    },
  });

  console.log("  ✓ Created test customer (phone: 0501234567)");

  // Create suppliers
  const createdSuppliers = [];

  for (const s of SUPPLIERS) {
    const supplier = await prisma.supplier.create({
      data: {
        name: s.name,
        phone: s.phone,
        email: s.email,
        slug: s.slug,
        category: Category.PHOTOGRAPHER,
        bioHe: s.bioHe,
        city: s.city,
        serviceAreas: s.serviceAreas,
        basePriceFrom: s.basePriceFrom,
        basePriceTo: s.basePriceTo,
        ratingAvg: s.ratingAvg,
        ratingCount: s.ratingCount,
        isVerified: s.isVerified,
        isActive: s.isActive,
        responseRate: 0.95,
      },
    });

    // Photos
    for (let i = 0; i < s.photos.length; i++) {
      await prisma.supplierPhoto.create({
        data: {
          supplierId: supplier.id,
          cloudinaryUrl: s.photos[i].url,
          publicId: `${s.slug}-${i}`,
          type: s.photos[i].type,
          sortOrder: i,
        },
      });
    }

    // Packages
    for (const pkg of s.packages) {
      await prisma.supplierPackage.create({
        data: {
          supplierId: supplier.id,
          nameHe: pkg.nameHe,
          descHe: pkg.descHe,
          price: pkg.price,
          hours: pkg.hours,
          includes: pkg.includes,
          isPopular: pkg.isPopular,
        },
      });
    }

    // Availability
    const availSlots = await generateAvailability(supplier.id);
    await prisma.availabilitySlot.createMany({ data: availSlots });

    // Reviews (3-5 per supplier)
    const reviewCount = 3 + Math.floor(Math.random() * 3);
    for (let r = 0; r < reviewCount; r++) {
      // Create a completed meeting first
      const meetingDate = new Date();
      meetingDate.setDate(meetingDate.getDate() - (30 + r * 15));

      const meeting = await prisma.meeting.create({
        data: {
          customerId: testCustomer.id,
          supplierId: supplier.id,
          requestedDate: meetingDate,
          startTime: "10:00",
          endTime: "11:00",
          status: "COMPLETED",
          meetingType: "VIDEO",
        },
      });

      await prisma.review.create({
        data: {
          customerId: testCustomer.id,
          supplierId: supplier.id,
          meetingId: meeting.id,
          rating: Math.random() > 0.2 ? 5 : 4,
          textHe: REVIEW_TEXTS[r % REVIEW_TEXTS.length],
          isVisible: true,
        },
      });
    }

    createdSuppliers.push(supplier);
    console.log(`  ✓ Created supplier: ${s.name} (${s.slug})`);
  }

  // Save a couple suppliers for the test customer
  await prisma.savedSupplier.create({
    data: { customerId: testCustomer.id, supplierId: createdSuppliers[0].id },
  });
  await prisma.savedSupplier.create({
    data: { customerId: testCustomer.id, supplierId: createdSuppliers[2].id },
  });

  // Create a pending meeting for the customer
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  await prisma.meeting.create({
    data: {
      customerId: testCustomer.id,
      supplierId: createdSuppliers[0].id,
      requestedDate: tomorrow,
      startTime: "14:00",
      endTime: "15:00",
      status: "PENDING",
      meetingType: "VIDEO",
      customerNotes: "רוצה לשמוע על החבילה המושלמת ואיך עובד התהליך",
    },
  });

  console.log("\n✅ Seed complete!");
  console.log("\n📋 Test credentials:");
  console.log("   Customer phone: 0501234567 (OTP shown in console — SMS is mocked)");
  console.log("   Supplier slugs:", createdSuppliers.map((s) => s.slug).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
