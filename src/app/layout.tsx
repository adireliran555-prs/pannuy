import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import ImpersonationBanner from "@/components/common/ImpersonationBanner";
import { BRAND_DESCRIPTION, BRAND_NAME, BRAND_TAGLINE } from "@/lib/branding";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: `${BRAND_NAME} - ${BRAND_TAGLINE}`,
  description: BRAND_DESCRIPTION,
  keywords: "צלמי חתונה, אולמות, תקליטנים, מאפרות, ספקי חתונה, ישראל",
  openGraph: {
    title: `${BRAND_NAME} - ספקי חתונה`,
    description: BRAND_TAGLINE,
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
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className="min-h-full flex flex-col bg-surface font-[var(--font-heebo)] antialiased">
        <ImpersonationBanner />
        {children}
      </body>
    </html>
  );
}
