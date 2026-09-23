import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

type SessionClaims = {
  id?: string;
  role?: "ADMIN" | "EMPLOYER" | "RECRUITER" | "CANDIDATE";
  exp?: number;
};

const AUTH_COOKIE_NAME = "hirego_session";

function jwtSecret() {
  return process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || null;
}

function signInFor(pathname: string) {
  if (pathname.startsWith("/admin")) return "/admin/login";
  if (pathname.startsWith("/employer")) return "/employer/employer-sign-in";
  return "/signin";
}

function allowedRoles(pathname: string): SessionClaims["role"][] | null {
  if (pathname.startsWith("/admin")) return ["ADMIN"];
  if (pathname.startsWith("/employer")) return ["EMPLOYER", "RECRUITER"];
  if (pathname === "/dashboard" || pathname.startsWith("/candidate")) return ["CANDIDATE"];
  return null;
}

function isPublicProtectedAreaPath(pathname: string) {
  return (
    pathname === "/admin/login" ||
    pathname === "/employer/employer-sign-in" ||
    pathname === "/employer/employer-forgot-password" ||
    pathname.startsWith("/employer/employer-registration") ||
    pathname.startsWith("/employer/employer-onboarding")
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicProtectedAreaPath(pathname)) return NextResponse.next();

  const roles = allowedRoles(pathname);
  if (!roles) return NextResponse.next();

  const secret = jwtSecret();
  if (!secret) {
    return new NextResponse("Authentication service is not configured.", { status: 503 });
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    const url = new URL(signInFor(pathname), request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  try {
    const claims = jwt.verify(token, secret) as SessionClaims;
    if (!claims.id || !claims.role || !roles.includes(claims.role)) {
      return NextResponse.redirect(new URL(signInFor(pathname), request.url));
    }
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL(signInFor(pathname), request.url));
    response.cookies.set(AUTH_COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/employer/:path*", "/candidate/:path*", "/dashboard"],
};
