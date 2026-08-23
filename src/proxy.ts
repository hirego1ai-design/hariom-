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
  "/employer/employer-registration-company-info",
  "/employer/employer-registration-otp-verification",
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
  jti?: string;
  sessionVersion?: number;
}

type DistributedSessionState = "valid" | "revoked" | "unavailable";

async function getRedisValue(key: string): Promise<string | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Redis session store is not configured");
  const response = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Redis session store request failed");
  const body = await response.json() as { result?: string | null };
  return body.result ?? null;
}

async function getDistributedSessionState(session: SessionPayload): Promise<DistributedSessionState> {
  if (process.env.NODE_ENV !== "production") return "valid";
  if (!session.jti) return "revoked"; // invalidate all legacy tokens on production rollout
  try {
    const [revoked, version] = await Promise.all([
      getRedisValue(`session:revoked:${session.jti}`),
      getRedisValue(`session:version:${session.id}`),
    ]);
    if (revoked || (version !== null && Number(version) > (session.sessionVersion ?? 0))) return "revoked";
    return "valid";
  } catch {
    return "unavailable";
  }
}

function decodeBase64Url(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function parseSessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    if (!secret) return null;
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0]))) as { alg?: string };
    if (header.alg !== "HS256") return null;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const validSignature = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64Url(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
    if (!validSignature) return null;

    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1]))) as SessionPayload;
    if (!payload.id || !payload.email || !["ADMIN", "EMPLOYER", "RECRUITER", "CANDIDATE"].includes(payload.role)) return null;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const token = bearer || request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await parseSessionToken(token) : null;

  if (session && !pathname.startsWith("/_next") && !pathname.includes(".")) {
    const sessionState = await getDistributedSessionState(session);
    if (sessionState !== "valid") {
      const response = NextResponse.json(
        { success: false, error: sessionState === "revoked" ? "Session has expired. Please sign in again." : "Session validation is temporarily unavailable." },
        { status: sessionState === "revoked" ? 401 : 503 },
      );
      response.cookies.set(AUTH_COOKIE_NAME, "", { httpOnly: true, expires: new Date(0), path: "/" });
      return response;
    }
  }

  // Every admin API requires a verified ADMIN session.
  if (pathname.startsWith("/api/admin")) {
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Administrator access required." }, { status: 403 });
    }
  }

  // 1. Static assets, non-admin API endpoints, and explicit public routes pass straight through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    publicRoutes.has(pathname)
  ) {
    const res = NextResponse.next();
    for (const [header, value] of Object.entries(securityHeaders)) {
      res.headers.set(header, value);
    }
    return res;
  }

  // 2. Admin Protected Routes (/admin/*)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!session || session.role !== "ADMIN") {
      const redirectUrl = new URL("/admin/login", request.url);
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
