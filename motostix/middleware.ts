import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DEBUG_PATH_MATCHER = /^\/debug(?:\/.*)?$/;
const DASHBOARD_PATH_MATCHER = /^\/dashboard(?:\/.*)?$/;
const ADMIN_PATH_MATCHER = /^\/dashboard\/admin(?:\/.*)?$/;
const SESSION_COOKIE_NAMES = ["__Secure-next-auth.session-token", "next-auth.session-token"] as const;

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some(name => request.cookies.has(name));
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  loginUrl.hash = "";

  return NextResponse.redirect(loginUrl);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.NODE_ENV === "production" && DEBUG_PATH_MATCHER.test(pathname)) {
    return NextResponse.rewrite(new URL("/not-found", request.url));
  }

  if (DASHBOARD_PATH_MATCHER.test(pathname) || ADMIN_PATH_MATCHER.test(pathname)) {
    if (!hasSessionCookie(request)) {
      return redirectToLogin(request);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/debug/:path*", "/dashboard/:path*", "/dashboard/admin/:path*"],
};
