import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DEBUG_PATH_MATCHER = /^\/debug(?:\/.*)?$/;

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const { pathname } = new URL(request.url);

    if (DEBUG_PATH_MATCHER.test(pathname)) {
      return NextResponse.rewrite(new URL("/not-found", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/debug/:path*"],
};
