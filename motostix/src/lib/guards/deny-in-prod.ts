import "server-only";

import { notFound } from "next/navigation";

import { isProd } from "../env";

/**
 * Denies access to debug-only routes in production by throwing Next.js's `notFound` response.
 *
 * Use this guard at the top of server components that should never render in production.
 * Calling it in development or test environments is a no-op, allowing debug tooling to work
 * locally while ensuring it is automatically disabled in production deployments.
 */
export function denyInProdForDebug(): void {
  if (isProd) {
    notFound();
  }
}
