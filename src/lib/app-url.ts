const DEFAULT_PRODUCTION_APP_URL = "https://topeventer.co.il";

/** Canonical public site URL (no trailing slash). */
export function getAppUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    return DEFAULT_PRODUCTION_APP_URL;
  }

  return "http://localhost:3000";
}
