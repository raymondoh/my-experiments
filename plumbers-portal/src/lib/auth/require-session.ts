// src/lib/auth/require-session.ts
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { userService } from "@/lib/services/user-service";

// Narrow unknown/string -> allowed app roles
const ROLE_VALUES = ["admin", "tradesperson", "customer", "user", "business_owner", "manager"] as const;
type RoleUnion = (typeof ROLE_VALUES)[number];
function toRole(r: unknown): RoleUnion {
  return ROLE_VALUES.includes(r as RoleUnion) ? (r as RoleUnion) : "customer";
}

// Narrow unknown/string -> subscription tier
const TIER_VALUES = ["basic", "pro", "business"] as const;
type TierUnion = (typeof TIER_VALUES)[number];
function toTier(t: unknown): TierUnion {
  return TIER_VALUES.includes(t as TierUnion) ? (t as TierUnion) : "basic";
}

// Narrow unknown/string -> subscription status
const STATUS_VALUES = ["active", "canceled", "past_due"] as const;
type StatusUnion = (typeof STATUS_VALUES)[number];
function toStatus(s: unknown): StatusUnion | null {
  return STATUS_VALUES.includes(s as StatusUnion) ? (s as StatusUnion) : null;
}

/**
 * Fetches the NextAuth session and ENRICHES it with fresh data from Firestore.
 * Redirects to /login if unauthenticated.
 */
export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const dbUser = await userService.getUserById(session.user.id);

  // --- THIS IS THE FIX ---
  // If the user exists in the session but not in the database, the session
  // is stale (e.g., after a DB reset). Invalidate it by forcing a sign-out.
  if (!dbUser) {
    redirect("/api/auth/signout");
  }

  // Enrich the session with fresh data from Firestore.
  session.user.role = toRole(dbUser.role);
  session.user.subscriptionTier = toTier(dbUser.subscriptionTier);
  session.user.subscriptionStatus = toStatus(dbUser.subscriptionStatus);
  session.user.name = dbUser.name ?? session.user.name ?? null;
  session.user.image = dbUser.profilePicture ?? session.user.image ?? null;
  session.user.onboardingComplete = dbUser.onboardingComplete ?? false;

  return session;
}

/**
 * Same as above, but returns null if not logged in (no redirect).
 */
export async function getOptionalFreshSession(): Promise<Session | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dbUser = await userService.getUserById(session.user.id);

  // --- THIS IS THE FIX ---
  // If the user doesn't exist in the DB, the session is stale. Return null.
  if (!dbUser) {
    return null;
  }

  // Enrich the session with fresh data from Firestore.
  session.user.role = toRole(dbUser.role);
  session.user.subscriptionTier = toTier(dbUser.subscriptionTier);
  session.user.subscriptionStatus = toStatus(dbUser.subscriptionStatus);
  session.user.name = dbUser.name ?? session.user.name ?? null;
  session.user.image = dbUser.profilePicture ?? session.user.image ?? null;
  session.user.onboardingComplete = dbUser.onboardingComplete ?? false;

  return session;
}
