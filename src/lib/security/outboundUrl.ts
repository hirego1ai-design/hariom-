import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

export class UnsafeOutboundUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeOutboundUrlError";
  }
}

function normalizeHost(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^\[/, "").replace(/\]$/, "").replace(/\.$/, "");
}

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224;
}

function isPrivateIpv6(address: string): boolean {
  const host = normalizeHost(address);
  if (host === "::" || host === "::1") return true;
  if (host.startsWith("fc") || host.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(host)) return true;
  if (host.startsWith("::ffff:")) {
    const mapped = host.slice("::ffff:".length);
    return isIP(mapped) === 4 ? isPrivateIpv4(mapped) : true;
  }
  return false;
}

export function isPrivateOrReservedAddress(address: string): boolean {
  const version = isIP(normalizeHost(address));
  if (version === 4) return isPrivateIpv4(normalizeHost(address));
  if (version === 6) return isPrivateIpv6(normalizeHost(address));
  return false;
}

export function parseAllowedHosts(raw: string | undefined): string[] | undefined {
  const hosts = raw?.split(",").map(normalizeHost).filter(Boolean);
  return hosts && hosts.length ? [...new Set(hosts)] : undefined;
}

export function assertSafeOutboundServiceUrl(
  rawUrl: string,
  options: { label?: string; requireHttps?: boolean; allowedHosts?: string[] } = {},
): URL {
  const label = options.label || "Outbound URL";
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UnsafeOutboundUrlError(`${label} must be a valid absolute URL.`);
  }
  if ((options.requireHttps ?? process.env.NODE_ENV === "production") && parsed.protocol !== "https:") {
    throw new UnsafeOutboundUrlError(`${label} must use HTTPS.`);
  }
  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new UnsafeOutboundUrlError(`${label} uses an unsupported protocol.`);
  }
  if (parsed.username || parsed.password) {
    throw new UnsafeOutboundUrlError(`${label} must not contain URL credentials.`);
  }

  const host = normalizeHost(parsed.hostname);
  const blockedNames = new Set([
    "localhost",
    "localhost.localdomain",
    "metadata",
    "metadata.google.internal",
    "instance-data",
  ]);
  if (!host || blockedNames.has(host) || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new UnsafeOutboundUrlError(`${label} targets a local or metadata hostname.`);
  }
  if (isPrivateOrReservedAddress(host)) {
    throw new UnsafeOutboundUrlError(`${label} targets a private or reserved network address.`);
  }

  const allowed = options.allowedHosts?.map(normalizeHost).filter(Boolean);
  if (allowed?.length && !allowed.includes(host)) {
    throw new UnsafeOutboundUrlError(`${label} host is not in the configured allowlist.`);
  }
  return parsed;
}

/**
 * Resolve a non-literal hostname before a sensitive server-side fetch and fail
 * closed if DNS points at loopback, link-local, RFC1918/ULA, multicast, or other
 * reserved address space. This is defense in depth for SSRF; callers must still
 * avoid accepting arbitrary user-controlled destinations.
 */
export async function assertSafeOutboundNetworkTarget(
  rawUrl: string,
  options: { label?: string; requireHttps?: boolean; allowedHosts?: string[] } = {},
): Promise<URL> {
  const parsed = assertSafeOutboundServiceUrl(rawUrl, options);
  const host = normalizeHost(parsed.hostname);
  if (isIP(host)) return parsed;

  let addresses: Awaited<ReturnType<typeof lookup>>;
  try {
    addresses = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new UnsafeOutboundUrlError(`${options.label || "Outbound URL"} hostname could not be resolved safely.`);
  }
  if (!addresses.length || addresses.some((entry) => isPrivateOrReservedAddress(entry.address))) {
    throw new UnsafeOutboundUrlError(`${options.label || "Outbound URL"} resolves to a private or reserved network address.`);
  }
  return parsed;
}
