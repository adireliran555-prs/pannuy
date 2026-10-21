// SSRF-hardened fetch for user-supplied URLs (landing import, image mirroring).
// - http(s) only, no credentials in URL
// - hostname must not be loopback / private / link-local (IPv4 + IPv6)
// - DNS is resolved up front and every resolved address is checked too
// - redirects are followed manually (max 3 hops) and each hop re-validated
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_REDIRECTS = 3;

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    a >= 224 // multicast / reserved / broadcast
  );
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (lower === "::" || lower === "::1") return true;
  if (lower.startsWith("fe80:") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
  if (lower.startsWith("ff")) return true; // multicast
  // IPv4-mapped (::ffff:a.b.c.d)
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  return false;
}

export function isPrivateAddress(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return isPrivateIpv4(ip);
  if (v === 6) return isPrivateIpv6(ip);
  return true;
}

/** Syntactic check only (no network). Returns the parsed URL or null. */
export function parsePublicHttpUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (u.username || u.password) return null;
    const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
      return null;
    }
    if (isIP(host) && isPrivateAddress(host)) return null;
    return u;
  } catch {
    return null;
  }
}

/** Syntactic + DNS check. Rejects hosts resolving to any private address. */
export async function assertPublicUrl(raw: string): Promise<URL | null> {
  const u = parsePublicHttpUrl(raw);
  if (!u) return null;
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) return u;
  try {
    const addrs = await lookup(host, { all: true, verbatim: true });
    if (addrs.length === 0) return null;
    if (addrs.some((a) => isPrivateAddress(a.address))) return null;
    return u;
  } catch {
    return null;
  }
}

/**
 * fetch() that validates the URL (incl. DNS) and follows up to MAX_REDIRECTS
 * redirects manually, re-validating each hop. Returns null when blocked.
 */
export async function safeFetch(
  raw: string,
  init: Omit<RequestInit, "redirect"> = {}
): Promise<{ res: Response; finalUrl: string } | null> {
  let current = raw;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const u = await assertPublicUrl(current);
    if (!u) return null;
    const res = await fetch(u.toString(), { ...init, redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc || hop === MAX_REDIRECTS) return null;
      current = new URL(loc, u).toString();
      continue;
    }
    return { res, finalUrl: u.toString() };
  }
  return null;
}
