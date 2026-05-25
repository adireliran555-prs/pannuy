import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "פנוי - מצאו את הספקים המושלמים לחתונה שלכם",
  description:
    "פנוי היא הפלטפורמה המובילה לחיפוש ספקי חתונה בישראל. בדיקת זמינות בזמן אמת, קביעת פגישה ישירות, ביקורות אמיתיות.",
  keywords: "צלמת חתונה, ספקי חתונה, חתונה, ישראל, פנוי",
  openGraph: {
    title: "פנוי - ספקי חתונה",
    description: "מצאו את הספקים המושלמים לחתונה שלכם",
    locale: "he_IL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-surface font-[var(--font-heebo)] antialiased">
        {children}
      </body>
    </html>
  );
}
