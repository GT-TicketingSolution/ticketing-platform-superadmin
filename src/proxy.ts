import { NextRequest, NextResponse } from "next/server";

import { eq, and, gt } from "drizzle-orm";

import { db } from "@/server/db";
import { sessions } from "@/server/db/schema";

import { SESSION_COOKIE, hashToken } from "@/server/auth/session";

const PROTECTED_ROUTES = [
  "/admin",
  "/dashboard",
  "/notifications",
  "/admin-requests",
  "/renewal",
];

function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Only run authentication for protected pages.
   */
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  /*
   * Get session cookie.
   */
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  console.log("PROXY:", {
    pathname,
    SESSION_COOKIE,
    hasSessionToken: !!sessionToken,
  });

  /*
   * No cookie = not authenticated.
   */
  if (!sessionToken) {
    return redirectToLogin(request);
  }

  try {
    /*
     * Hash cookie token.
     */
    const tokenHash = hashToken(sessionToken);

    /*
     * Check actual session in database.
     */
    const result = await db
      .select({
        id: sessions.id,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.tokenHash, tokenHash),
          gt(sessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    const session = result[0];

    /*
     * Cookie exists but session doesn't exist.
     */
    if (!session) {
      const response = redirectToLogin(request);

      response.cookies.delete(SESSION_COOKIE);

      return response;
    }

    /*
     * Valid session.
     */
    return NextResponse.next();
  } catch (error) {
    console.error("PROXY_AUTH_ERROR:", error);

    /*
     * Fail closed.
     */
    const response = redirectToLogin(request);

    response.cookies.delete(SESSION_COOKIE);

    return response;
  }
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",

    "/dashboard",
    "/dashboard/:path*",

    "/notifications",
    "/notifications/:path*",

    "/admin-requests",
    "/admin-requests/:path*",

    "/renewal",
    "/renewal/:path*",
  ],
};
