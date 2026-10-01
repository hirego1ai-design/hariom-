export const POST_AUTH_REDIRECT_STORAGE_KEY = "hirego_post_auth_redirect";

export function safeInternalRedirect(
  value: string | null | undefined,
  fallback = "/dashboard",
): string {
  const candidate = value?.trim();
  if (
    !candidate ||
    candidate.length > 1000 ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(candidate)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, "https://www.hiregoai.com");
    if (parsed.origin !== "https://www.hiregoai.com") return fallback;

    // URL parsing normalizes dot segments. Re-validate the final navigation
    // target rather than trusting only the raw input; e.g. a path such as
    // /internal/..//attacker.example can normalize to a protocol-relative
    // destination beginning with //.
    const normalizedPath = parsed.pathname;
    if (
      !normalizedPath.startsWith("/") ||
      normalizedPath.startsWith("//") ||
      normalizedPath.includes("\\") ||
      /%(?:2f|5c)/i.test(normalizedPath) ||
      /[\u0000-\u001F\u007F]/.test(normalizedPath)
    ) {
      return fallback;
    }

    return `${normalizedPath}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
