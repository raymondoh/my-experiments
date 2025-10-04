"use server";

import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

/**
 * Derive the current request path for building `next` query parameters.
 * Falls back to the dashboard root when the path cannot be determined.
 */
function getCurrentPath(): string {
  const headerList = headers();

  const invokePath = headerList.get("x-invoke-path") ?? headerList.get("x-pathname");
  const invokeQuery = headerList.get("x-invoke-query");

  if (invokePath) {
    const normalizedPath = invokePath.startsWith("/") ? invokePath : `/${invokePath}`;
    if (invokeQuery && invokeQuery !== "undefined") {
      const normalizedQuery = invokeQuery.startsWith("?") ? invokeQuery : `?${invokeQuery}`;
      return `${normalizedPath}${normalizedQuery}`;
    }
    return normalizedPath;
  }

  const nextUrlHeader = headerList.get("next-url");
  if (nextUrlHeader) {
    try {
      const base = nextUrlHeader.startsWith("http") ? undefined : "http://localhost";
      const parsed = new URL(nextUrlHeader, base);
      return `${parsed.pathname}${parsed.search}` || "/dashboard";
    } catch {
      if (nextUrlHeader.startsWith("/")) {
        return nextUrlHeader;
      }
    }
  }

  const referer = headerList.get("referer");
  if (referer) {
    try {
      const parsed = new URL(referer);
      return `${parsed.pathname}${parsed.search}` || "/dashboard";
    } catch {
      // ignore invalid referer URLs
    }
  }

  return "/dashboard";
}

/**
 * Ensure the current request has an authenticated session.
 * Redirects to the login page when unauthenticated.
 */
export async function requireAuth(): Promise<Session> {
  const session = await auth();

  if (!session?.user) {
    const next = encodeURIComponent(getCurrentPath());
    redirect(`/login?next=${next}`);
  }

  return session;
}

/**
 * Ensure the current request belongs to an administrator.
 * Redirects to the not-authorized page for non-admin sessions.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();

  if (session.user.role !== "admin") {
    redirect("/not-authorized");
  }

  return session;
}
