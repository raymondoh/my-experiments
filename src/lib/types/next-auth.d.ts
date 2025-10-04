// src/lib/types/next-auth.d.ts
import type { DefaultSession, DefaultUser } from "next-auth";
import type { UserRole } from "@/lib/auth/roles";

/** Shared unions for your app */
type SubscriptionTier = "basic" | "pro" | "business";
type SubscriptionStatus = "active" | "canceled" | "past_due" | null;

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      emailVerified: Date | null;
      onboardingComplete?: boolean;
      subscriptionTier?: SubscriptionTier;
      subscriptionStatus?: SubscriptionStatus;
    };
  }

  interface User extends DefaultUser {
    role: UserRole;
    emailVerified: Date | null;
    onboardingComplete?: boolean;
    subscriptionTier?: SubscriptionTier;
    subscriptionStatus?: SubscriptionStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    emailVerified: Date | null;
    onboardingComplete?: boolean;
    subscriptionTier?: SubscriptionTier;
    subscriptionStatus?: SubscriptionStatus;
  }
}
