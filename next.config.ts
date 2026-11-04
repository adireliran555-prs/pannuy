import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // tesseract.js spawns a worker thread from its own files and loads WASM at
  // runtime — keep it external and make sure Vercel ships it with the language data.
  serverExternalPackages: ["tesseract.js", "tesseract.js-core"],
  outputFileTracingIncludes: {
    "/api/supplier/photos": ["./tessdata/**", "./node_modules/tesseract.js/**", "./node_modules/tesseract.js-core/**"],
    "/api/cron/pii-sweep": ["./tessdata/**", "./node_modules/tesseract.js/**", "./node_modules/tesseract.js-core/**"],
    "/api/cron/renew-calendar-watches": ["./tessdata/**", "./node_modules/tesseract.js/**", "./node_modules/tesseract.js-core/**"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
    formats: ["image/avif", "image/webp"],
    unoptimized: process.env.NODE_ENV === "development",
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;
