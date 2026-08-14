import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "hirego_session";

const publicRoutes = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/admin/login",
  "/employer/employer-sign-in",
  "/employer/employer-forgot-password",
  "/employer/employer-registration",
]);

const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=(self), geolocation=(), payment=(self)",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-DNS-Prefetch-Control": "on",
};

interface SessionPayload {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EMPLOYER" | "RECRUITER" | "CANDIDATE";
  exp?: number;
}

function parseSessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const normalizedPayload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const base64 = normalizedPayload.padEnd(normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4), "=");
    const json = atob(base64);
    const payload = JSON.parse(json);
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Developer Bypass Gate
  const bypassParam = request.nextUrl.searchParams.get("bypass");
  if (bypassParam === "true") {
    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItYWRtaW4tMSIsImVtYWlsIjoiYWRtaW5AaGlyZWdvLmFpIiwicm9sZSI6IkFETUlOIiwibmFtZSI6IkRldmVsb3BlciBCeXBhc3MifQ.mockSignature";
    const cleanUrl = new URL(pathname, request.url);
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set(AUTH_COOKIE_NAME, mockToken, { maxAge: 12 * 60 * 60 });
    return response;
  }

  // 1. Static assets, API endpoints, and explicit public routes pass straight through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    publicRoutes.has(pathname) ||
    pathname.startsWith("/employer/employer-registration")
  ) {
    const res = NextResponse.next();
    for (const [header, value] of Object.entries(securityHeaders)) {
      res.headers.set(header, value);
    }
    return res;
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? parseSessionToken(token) : null;

  // 2. Admin Protected Routes (/admin/*)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!session || (session.role !== "ADMIN" && !session.email?.includes("admin"))) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 3. Employer Protected Routes (/employer/*)
  if (pathname.startsWith("/employer") && 
      pathname !== "/employer/employer-sign-in" && 
      pathname !== "/employer/employer-registration-company-info") {
    if (!session || (session.role !== "EMPLOYER" && session.role !== "RECRUITER" && session.role !== "ADMIN")) {
      const redirectUrl = new URL("/employer/employer-sign-in", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 4. Candidate Protected Routes (/candidate/*)
  if (pathname.startsWith("/candidate")) {
    if (!session || (session.role !== "CANDIDATE" && session.role !== "ADMIN")) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 5. General Authenticated Routes (dashboard, profile, onboarding, AI, assessments, interviews)
  const authRequiredPrefixes = [
    "/dashboard", "/profile", "/onboarding", "/ai/",
    "/assessment/", "/video-assessment/", "/interviews",
    "/applications", "/messages", "/notifications",
    "/offers", "/billing", "/checkout", "/settings",
    "/subscriptions", "/referrals", "/leaderboard",
  ];
  const needsAuth = authRequiredPrefixes.some((prefix) => pathname.startsWith(prefix));
  if (needsAuth && !session) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.next();

  for (const [header, value] of Object.entries(securityHeaders)) {
    response.headers.set(header, value);
  }

  if (request.nextUrl.protocol === "https:") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  return response;
}

export default proxy;

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
