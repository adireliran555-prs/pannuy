import type { Metadata, Viewport } from "next";
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
      { url: OG_IMAGE_PATH, width: 512, height: 512, alt: BRAND_NAME },
    ],
  },
  twitter: {
    card: "summary",
    title: `${BRAND_NAME} | ${BRAND_TAGLINE}`,
    description: BRAND_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#FAFAF8",
  width: "device-width",
  initialScale: 1,
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
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-text-main focus:shadow-lg"
        >
          דלגו לתוכן
        </a>
        <ImpersonationBanner />
        <div id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          {children}
        </div>
      </body>
    </html>
  );
}
