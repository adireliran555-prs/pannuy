import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import ImpersonationBanner from "@/components/common/ImpersonationBanner";
import {
  APP_URL,
  BRAND_DESCRIPTION,
  BRAND_NAME,
  BRAND_TAGLINE,
  OG_IMAGE_PATH,
} from "@/lib/branding";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${BRAND_NAME} | ${BRAND_TAGLINE}`,
    template: `%s | ${BRAND_NAME}`,
  },
  description: BRAND_DESCRIPTION,
  keywords: [
    "צלמי אירועים",
    "אולמות",
    "תקליטנים",
    "מאפרות",
    "ספקי אירועים",
    "ישראל",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: `${BRAND_NAME} | ${BRAND_TAGLINE}`,
    description: BRAND_DESCRIPTION,
    url: APP_URL,
    siteName: BRAND_NAME,
    locale: "he_IL",
    type: "website",
    images: [
      { url: OG_IMAGE_PATH, width: 1200, height: 630, alt: BRAND_NAME },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} | ${BRAND_TAGLINE}`,
    description: BRAND_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
  robots: { index: true, follow: true },
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
      <body
        suppressHydrationWarning
        className={`${heebo.className} min-h-full flex flex-col bg-surface antialiased`}
      >
        <ImpersonationBanner />
        {children}
      </body>
    </html>
  );
}
