/** Safe internal redirect path (no open redirects). */
export function sanitizeReturnTo(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw.startsWith("/start") && !raw.startsWith("/start/wedding")) return null;
  return raw;
}

export function returnToFromSearch(search: string): string | null {
  return sanitizeReturnTo(new URLSearchParams(search).get("returnTo"));
}

export function withReturnTo(path: string, returnTo: string | null): string {
  const safe = sanitizeReturnTo(returnTo);
  if (!safe) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}returnTo=${encodeURIComponent(safe)}`;
}
