/**
 * Headers owned by the application.  Keep the definition separate from the
 * security-status UI so the UI can report what is actually configured rather
 * than a user-editable, simulated value.
 */
export const BASE_SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=(self), geolocation=(), payment=(self)",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-DNS-Prefetch-Control": "on",
};

/**
 * Next currently emits inline bootstrap/style content.  The policy therefore
 * permits inline styles and scripts, while still blocking object injection,
 * framing, untrusted origins and insecure resource upgrades.  `unsafe-eval`
 * is limited to local development for the dev tooling.
 */
export function contentSecurityPolicy(isDevelopment = false): string {
  const scriptSources = ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"];
  if (isDevelopment) scriptSources.push("'unsafe-eval'");

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https: wss:",
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function configuredSecurityHeaders(isDevelopment = false): Record<string, string> {
  return {
    ...BASE_SECURITY_HEADERS,
    "Content-Security-Policy": contentSecurityPolicy(isDevelopment),
  };
}
