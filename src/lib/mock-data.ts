export interface MockSupplier {
  id: string;
  slug: string;
  name: string;
  city: string;
  profilePhoto: string;
  coverPhoto: string;
  rating: number;
  ratingCount: number;
  priceFrom: number;
  priceTo: number;
  category: string;
  isAvailable?: boolean;
  isSaved?: boolean;
  bio: string;
  responseRate: number;
  responseTime: string;
  areas: string[];
  packages: MockPackage[];
  reviews: MockReview[];
  portfolio: string[];
}

export interface MockPackage {
  id: string;
  name: string;
  price: number;
  hours: number;
  includes: string[];
  isPopular?: boolean;
}

export interface MockReview {
  id: string;
  reviewerName: string;
  date: string;
  rating: number;
  text: string;
  avatar?: string;
}

const portfolioPhotos = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
  "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800",
  "https://images.unsplash.com/photo-1529636444744-adffc9135a5e?w=800",
  "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=800",
  "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800",
  "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800",
  "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800",
];

const profilePhotos = [
  "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400",
  "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400",
];

const coverPhotos = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200",
  "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200",
  "https://images.unsplash.com/photo-1529636444744-adffc9135a5e?w=1200",
  "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=1200",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200",
];

export const MOCK_SUPPLIERS: MockSupplier[] = [
  {
    id: "1",
    slug: "maya-cohen-photography",
    name: "מאיה כהן",
    city: "תל אביב",
    profilePhoto: profilePhotos[0],
    coverPhoto: coverPhotos[0],
    rating: 4.9,
    ratingCount: 87,
    priceFrom: 4500,
    priceTo: 12000,
    category: "צלמת חתונה",
    isAvailable: true,
    isSaved: false,
    bio: "היי! אני מאיה, צלמת חתונות עם ניסיון של 8 שנים. הסגנון שלי הוא תיעודי-רומנטי — אני מאמינה שהרגעים האמיתיים ביותר הם אלה שקורים בין הצילומים הרשמיים. כל זוג מקבל ממני טיפול אישי, ייחודי, ועבודה שתמשיך לרגש אתכם עשרות שנים.",
    responseRate: 98,
    responseTime: "תוך שעה",
    areas: ["תל אביב", "גוש דן", "הרצליה", "רמת גן"],
    portfolio: portfolioPhotos,
    packages: [
      {
        id: "p1",
        name: "חבילת בסיס",
        price: 4500,
        hours: 6,
        includes: ["6 שעות צילום", "500+ תמונות ערוכות", "גלריה דיגיטלית מאובטחת", "מסירה תוך 6 שבועות"],
      },
      {
        id: "p2",
        name: "חבילת פרימיום",
        price: 7500,
        hours: 10,
        includes: ["10 שעות צילום", "900+ תמונות ערוכות", "אלבום יוקרה 20×30", "גלריה דיגיטלית", "צלמת שנייה", "מסירה תוך 4 שבועות"],
        isPopular: true,
      },
      {
        id: "p3",
        name: "חבילת יוקרה",
        price: 12000,
        hours: 14,
        includes: ["14 שעות צילום", "1200+ תמונות ערוכות", "2 אלבומי יוקרה", "סרטון highlights", "2 צלמות", "גלריה דיגיטלית + USB", "מסירה תוך 3 שבועות"],
      },
    ],
    reviews: [
      {
        id: "r1",
        reviewerName: "נועה לוי",
        date: "מרץ 2025",
        rating: 5,
        text: "מאיה היא פשוט מדהימה. היא הצליחה ללכוד כל רגע ורגע בחתונה שלנו בצורה כל כך טבעית ויפה. האלבום שיצא הוא חלום שהתגשם. בחרו בה בלי לחשוב פעמיים!",
      },
      {
        id: "r2",
        reviewerName: "שירה אברהם",
        date: "ינואר 2025",
        rating: 5,
        text: "פנייה שלחתי ומאיה ענתה תוך 20 דקות! מקצוענית לחלוטין, עבדה בצורה שקטה וחלקה לאורך כל האירוע. התמונות פשוט עוצרות נשימה.",
      },
      {
        id: "r3",
        reviewerName: "תמר גולן",
        date: "דצמבר 2024",
        rating: 5,
        text: "השקענו הרבה מאוד בבחירת הצלמת ואני כל כך שמחה שבחרנו במאיה. היא פשוט ידעה להיות בכל המקומות הנכונים בזמן הנכון.",
      },
    ],
  },
  {
    id: "2",
    slug: "dana-mizrahi-photos",
    name: "דנה מזרחי",
    city: "ירושלים",
    profilePhoto: profilePhotos[1],
    coverPhoto: coverPhotos[1],
    rating: 4.8,
    ratingCount: 62,
    priceFrom: 3800,
    priceTo: 9500,
    category: "צלמת חתונה",
    isAvailable: true,
    isSaved: true,
    bio: "צלמת חתונות ירושלמית עם עין לפרטים הקטנים. מתמחה בצילום חוץ ובאורות זהב של שקיעה.",
    responseRate: 95,
    responseTime: "תוך 2 שעות",
    areas: ["ירושלים", "מודיעין", "בית שמש"],
    portfolio: portfolioPhotos.slice(2),
    packages: [
      {
        id: "p1",
        name: "חבילת בסיס",
        price: 3800,
        hours: 6,
        includes: ["6 שעות", "400+ תמונות", "גלריה דיגיטלית"],
      },
      {
        id: "p2",
        name: "חבילת מלאה",
        price: 6500,
        hours: 10,
        includes: ["10 שעות", "800+ תמונות", "אלבום", "גלריה"],
        isPopular: true,
      },
    ],
    reviews: [
      {
        id: "r1",
        reviewerName: "ליאת שפירא",
        date: "פברואר 2025",
        rating: 5,
        text: "דנה יצרה תמונות שאנחנו נאהב לכל החיים. מקצוענית, נעימה ועם עין יוצאת דופן.",
      },
    ],
  },
  {
    id: "3",
    slug: "sarah-peretz-wedding",
    name: "שרה פרץ",
    city: "חיפה",
    profilePhoto: profilePhotos[2],
    coverPhoto: coverPhotos[2],
    rating: 4.7,
    ratingCount: 44,
    priceFrom: 3200,
    priceTo: 8000,
    category: "צלמת חתונה",
    isAvailable: false,
    isSaved: false,
    bio: "מאמינה בצילום שמספר סיפור. כל חתונה היא ייחודית ואני מביאה את עצמי לכל אחת.",
    responseRate: 92,
    responseTime: "תוך 3 שעות",
    areas: ["חיפה", "נהריה", "עכו"],
    portfolio: portfolioPhotos.slice(1, 7),
    packages: [
      {
        id: "p1",
        name: "חבילה בסיסית",
        price: 3200,
        hours: 6,
        includes: ["6 שעות", "350+ תמונות", "גלריה"],
      },
    ],
    reviews: [],
  },
  {
    id: "4",
    slug: "rachel-ben-david",
    name: "רחל בן דוד",
    city: "ראשון לציון",
    profilePhoto: profilePhotos[3],
    coverPhoto: coverPhotos[3],
    rating: 5.0,
    ratingCount: 31,
    priceFrom: 5000,
    priceTo: 14000,
    category: "צלמת חתונה",
    isAvailable: true,
    isSaved: false,
    bio: "צלמת high-end עם עדשת מבט ייחודית. עבדתי עם זוגות מכל הארץ.",
    responseRate: 100,
    responseTime: "תוך 30 דקות",
    areas: ["גוש דן", "תל אביב", "פתח תקווה"],
    portfolio: portfolioPhotos,
    packages: [
      {
        id: "p1",
        name: "Elite",
        price: 5000,
        hours: 8,
        includes: ["8 שעות", "700+ תמונות", "גלריה"],
        isPopular: true,
      },
    ],
    reviews: [
      {
        id: "r1",
        reviewerName: "מורן כץ",
        date: "אפריל 2025",
        rating: 5,
        text: "5 כוכבים ועוד. רחל היא האישה הכי מקצועית ונחמדה שפגשנו.",
      },
    ],
  },
  {
    id: "5",
    slug: "yael-sharon-photo",
    name: "יעל שרון",
    city: "נתניה",
    profilePhoto: profilePhotos[4],
    coverPhoto: coverPhotos[4],
    rating: 4.6,
    ratingCount: 28,
    priceFrom: 2800,
    priceTo: 7000,
    category: "צלמת חתונה",
    isAvailable: true,
    isSaved: false,
    bio: "צלמת צעירה עם גישה פרסית-מודרנית. אני אוהבת ליצור תמונות שמרגישות חיות.",
    responseRate: 90,
    responseTime: "תוך שעתיים",
    areas: ["נתניה", "הרצליה", "כפר סבא"],
    portfolio: portfolioPhotos.slice(3),
    packages: [
      {
        id: "p1",
        name: "חבילה בסיסית",
        price: 2800,
        hours: 5,
        includes: ["5 שעות", "300+ תמונות", "גלריה"],
      },
    ],
    reviews: [],
  },
  {
    id: "6",
    slug: "michal-oren-weddings",
    name: "מיכל אורן",
    city: "רמת גן",
    profilePhoto: profilePhotos[5],
    coverPhoto: coverPhotos[5],
    rating: 4.9,
    ratingCount: 73,
    priceFrom: 4200,
    priceTo: 11000,
    category: "צלמת חתונה",
    isAvailable: true,
    isSaved: false,
    bio: "כבר 10 שנים שאני מתמחה בצילום חתונות אינטימיות. התשוקה שלי היא לתעד רגשות אמיתיים.",
    responseRate: 97,
    responseTime: "תוך שעה",
    areas: ["רמת גן", "גבעתיים", "תל אביב", "בני ברק"],
    portfolio: portfolioPhotos,
    packages: [
      {
        id: "p1",
        name: "בסיס",
        price: 4200,
        hours: 6,
        includes: ["6 שעות", "500+ תמונות", "גלריה"],
      },
      {
        id: "p2",
        name: "פרימיום",
        price: 7800,
        hours: 10,
        includes: ["10 שעות", "900+ תמונות", "אלבום", "גלריה"],
        isPopular: true,
      },
    ],
    reviews: [
      {
        id: "r1",
        reviewerName: "הילה ורד",
        date: "מרץ 2025",
        rating: 5,
        text: "מיכל היא מתנה מהשמיים. היא לא רק צלמת — היא אמנית.",
      },
    ],
  },
];

export const MEETING_MOCK = [
  {
    id: "m1",
    supplier: MOCK_SUPPLIERS[0],
    date: "2025-06-15",
    time: "11:00",
    type: "video",
    status: "confirmed",
    notes: "נדבר על הקונספט לחתונה ונסכם פרטים",
  },
  {
    id: "m2",
    supplier: MOCK_SUPPLIERS[1],
    date: "2025-06-20",
    time: "14:00",
    type: "phone",
    status: "pending",
    notes: "",
  },
  {
    id: "m3",
    supplier: MOCK_SUPPLIERS[2],
    date: "2025-05-10",
    time: "10:00",
    type: "in-person",
    status: "completed",
    notes: "",
  },
];
