// src/components/auth/subscription-guard.tsx
"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";

type Tier = "basic" | "pro" | "business";

interface SubscriptionGuardProps {
  allowedTiers: Tier[];
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional: pass a fresh tier from the server (e.g., Firestore) to avoid stale session data */
  tierOverride?: Tier;
}

/**
 * Renders children only if the user's subscription tier is in `allowedTiers`.
 * Falls back to "basic" when tier is missing.
 * If `tierOverride` is provided, it takes precedence over the session tier.
 */
export default function SubscriptionGuard({
  allowedTiers,
  children,
  fallback = null,
  tierOverride
}: SubscriptionGuardProps) {
  const { data: session, status } = useSession();

  // If we don't have an override and session is still loading, avoid flicker
  if (!tierOverride && status === "loading") return null;

  const tier: Tier = tierOverride ?? (session?.user?.subscriptionTier as Tier | undefined) ?? "basic";

  return allowedTiers.includes(tier) ? <>{children}</> : <>{fallback}</>;
}
