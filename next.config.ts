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

// tesseract.js spawns a worker thread that require()s these at runtime — the
// bundler cannot see them, so ship them (and the language data) explicitly.
const OCR_FILES = ["./tessdata/**", "./node_modules/tesseract.js/**", "./node_modules/tesseract.js-core/**", "./node_modules/bmp-js/**", "./node_modules/idb-keyval/**", "./node_modules/is-url/**", "./node_modules/node-fetch/**", "./node_modules/opencollective-postinstall/**", "./node_modules/regenerator-runtime/**", "./node_modules/wasm-feature-detect/**", "./node_modules/zlibjs/**", "./node_modules/whatwg-url/**", "./node_modules/webidl-conversions/**", "./node_modules/tr46/**"];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // tesseract.js spawns a worker thread from its own files and loads WASM at
  // runtime — keep it external and make sure Vercel ships it with the language data.
  serverExternalPackages: ["tesseract.js", "tesseract.js-core"],
  outputFileTracingIncludes: {
    "/api/supplier/photos": OCR_FILES,
    "/api/cron/pii-sweep": OCR_FILES,
    "/api/cron/renew-calendar-watches": OCR_FILES,
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
