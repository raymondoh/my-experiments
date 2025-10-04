// // src/lib/types/user.ts
// import type { Certification } from "./certification";

// // Define UserRole and other status types based on application usage
// export type UserRole = "admin" | "tradesperson" | "customer" | "user" | "business_owner" | "manager";
// export type SubscriptionStatus =
//   | "active"
//   | "canceled"
//   | "incomplete"
//   | "incomplete_expired"
//   | "past_due"
//   | "trialing"
//   | "unpaid"
//   | null;
// export type UserStatus = "active" | "suspended";

// export interface User {
//   id: string;
//   name?: string | null;
//   firstName?: string | null;
//   lastName?: string | null;
//   email: string | null;
//   emailVerified?: Date | null;
//   image?: string | null;
//   role: UserRole;
//   disabled?: boolean;
//   phone?: string | null;
//   slug?: string | null;
//   location?: {
//     postcode?: string | null;
//     town?: string | null;
//     address?: string | null;
//     latitude?: number | null;
//     longitude?: number | null;
//   } | null;
//   onboardingComplete: boolean;
//   businessName?: string | null;
//   googleBusinessProfileUrl?: string | null;
//   serviceAreas?: string | null;
//   specialties?: string[] | null;
//   experience?: string | null;
//   description?: string | null;
//   hourlyRate?: string | null;
//   profilePicture?: string | null;
//   portfolio?: string[] | null;
//   certifications?: Certification[] | null;
//   createdAt: Date;
//   updatedAt: Date;
//   lastLoginAt?: Date | null;
//   lastActiveAt?: Date | null;
//   isFeatured?: boolean;
//   featureExpiresAt?: Date | null;

//   // Add the new fields for searching
//   citySlug?: string | null;
//   serviceAreaSlugs?: string[] | null;
//   serviceSlugs?: string[] | null;

//   // Subscription and Stripe
//   subscriptionTier?: "basic" | "pro" | "business" | "free" | null;
//   subscriptionStatus?: SubscriptionStatus;
//   stripeCustomerId?: string | null;
//   stripeSubscriptionId?: string | null;
//   stripeConnectAccountId?: string | null;
//   stripeOnboardingComplete?: boolean;

//   // App-specific logic
//   notificationSettings?: {
//     newJobAlerts?: boolean;
//   };
//   hasSubmittedQuote?: boolean;
//   avgRating?: number | null;
//   reviewsCount?: number | null;
//   favoriteTradespeople?: string[];
//   termsAcceptedAt?: Date | null;
//   searchKeywords?: string[] | null;
//   quoteResetDate?: Date | null;
//   monthlyQuotesUsed?: number | null;
//   status?: UserStatus | null;

// }

// export interface CreateUserData {
//   emailVerified?: Date | null;
//   image?: string | null;
//   disabled?: boolean;
//   onboardingComplete?: boolean;
//   subscriptionTier?: "basic" | "pro" | "business";
//   stripeCustomerId?: string;
//   stripeConnectAccountId?: string | null;
//   subscriptionStatus?: SubscriptionStatus;
//   status?: "active" | "suspended";
//   certifications?: Certification[];
// }

// export interface UpdateUserData {
//   name?: string;
//   slug?: string;
//   firstName?: string;
//   lastName?: string;
//   phone?: string | null;

//   // Location
//   location?: {
//     postcode?: string | null;
//     town?: string | null;
//     address?: string | null;
//     latitude?: number | null;
//     longitude?: number | null;
//   };

//   // Profile info
//   businessName?: string | null;
//   googleBusinessProfileUrl?: string | null;
//   serviceAreas?: string | null;
//   specialties?: string[];
//   experience?: string | null;
//   description?: string | null;
//   hourlyRate?: string | null;
//   profilePicture?: string | null;
//   portfolio?: string[] | null;
//   favoriteTradespeople?: string[];
//   certifications?: Certification[];
//   notificationSettings?: {
//     newJobAlerts?: boolean;
//   };

//   onboardingComplete?: boolean;
//   role?: UserRole;

//   // Add the new fields so they can be included in updates
//   citySlug?: string;
//   serviceAreaSlugs?: string[];
//   serviceSlugs?: string[];

//   // Subscription info
//   subscriptionTier?: "basic" | "pro" | "business" | "free";
//   stripeCustomerId?: string | null;
//   stripeConnectAccountId?: string | null;
//   stripeSubscriptionId?: string | null;
//   stripeOnboardingComplete?: boolean;
//   subscriptionStatus?: SubscriptionStatus;
//   status?: "active" | "suspended";
//   monthlyQuotesUsed?: number;
//   quoteResetDate?: Date | null;

//   isFeatured?: boolean;
//   featureExpiresAt?: Date | null;
//   termsAcceptedAt?: Date;
// }
import type { Certification } from "./certification";

// Define UserRole and other status types based on application usage
export type UserRole = "admin" | "tradesperson" | "customer" | "user" | "business_owner" | "manager";
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "trialing"
  | "unpaid"
  | null;
export type UserStatus = "active" | "suspended";

export interface User {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  role: UserRole;
  disabled?: boolean;
  phone?: string | null;
  slug?: string | null;
  location?: {
    postcode?: string | null;
    town?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  onboardingComplete: boolean;
  businessName?: string | null;
  googleBusinessProfileUrl?: string | null;
  serviceAreas?: string | null;
  specialties?: string[] | null;
  experience?: string | null;
  description?: string | null;
  hourlyRate?: string | null;
  profilePicture?: string | null;
  portfolio?: string[] | null;
  certifications?: Certification[] | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
  lastActiveAt?: Date | null;
  isFeatured?: boolean;
  featureExpiresAt?: Date | null;

  // Add the new fields for searching
  citySlug?: string | null;
  serviceAreaSlugs?: string[] | null;
  serviceSlugs?: string[] | null;

  // Subscription and Stripe
  subscriptionTier?: "basic" | "pro" | "business" | "free" | null;
  subscriptionStatus?: SubscriptionStatus;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeConnectAccountId?: string | null;
  stripeOnboardingComplete?: boolean;

  // App-specific logic
  notificationSettings?: {
    newJobAlerts?: boolean;
  };
  hasSubmittedQuote?: boolean;
  avgRating?: number | null;
  reviewsCount?: number | null;
  // Add the nested 'reviews' object to support the updated components
  reviews?: {
    averageRating: number;
    count: number;
  };
  favoriteTradespeople?: string[];
  termsAcceptedAt?: Date | null;
  searchKeywords?: string[] | null;
  quoteResetDate?: Date | null;
  monthlyQuotesUsed?: number | null;
  status?: UserStatus | null;
}

export interface CreateUserData {
  emailVerified?: Date | null;
  image?: string | null;
  disabled?: boolean;
  onboardingComplete?: boolean;
  subscriptionTier?: "basic" | "pro" | "business";
  stripeCustomerId?: string;
  stripeConnectAccountId?: string | null;
  subscriptionStatus?: SubscriptionStatus;
  status?: "active" | "suspended";
  certifications?: Certification[];
}

export interface UpdateUserData {
  name?: string;
  slug?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;

  // Location
  location?: {
    postcode?: string | null;
    town?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };

  // Profile info
  businessName?: string | null;
  googleBusinessProfileUrl?: string | null;
  serviceAreas?: string | null;
  specialties?: string[];
  experience?: string | null;
  description?: string | null;
  hourlyRate?: string | null;
  profilePicture?: string | null;
  portfolio?: string[] | null;
  favoriteTradespeople?: string[];
  certifications?: Certification[];
  notificationSettings?: {
    newJobAlerts?: boolean;
  };

  onboardingComplete?: boolean;
  role?: UserRole;

  // Add the new fields so they can be included in updates
  citySlug?: string;
  serviceAreaSlugs?: string[];
  serviceSlugs?: string[];

  // Subscription info
  subscriptionTier?: "basic" | "pro" | "business" | "free";
  stripeCustomerId?: string | null;
  stripeConnectAccountId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeOnboardingComplete?: boolean;
  subscriptionStatus?: SubscriptionStatus;
  status?: "active" | "suspended";
  monthlyQuotesUsed?: number;
  quoteResetDate?: Date | null;

  isFeatured?: boolean;
  featureExpiresAt?: Date | null;
  termsAcceptedAt?: Date;
}
