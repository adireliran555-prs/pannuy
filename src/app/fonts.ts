// Self-hosted Heebo (variable weight 100–900, hebrew + latin subsets).
// Replaces next/font/google so production builds don't depend on Google Fonts
// being reachable from Vercel's build network.
import localFont from "next/font/local";

export const heebo = localFont({
  src: [
    { path: "../../public/fonts/heebo-hebrew.woff2", weight: "100 900", style: "normal" },
    { path: "../../public/fonts/heebo-latin.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-heebo",
  display: "swap",
});
