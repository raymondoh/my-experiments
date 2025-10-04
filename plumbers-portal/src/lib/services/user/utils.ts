// src/lib/services/user/utils.ts
import type { User } from "@/lib/types/user";
import type { Certification } from "@/lib/types/certification";
import type { UserRole } from "@/lib/auth/roles";
import { Timestamp } from "firebase-admin/firestore";

interface FirestoreCertification {
  name: string;
  issuingBody: string;
  fileUrl?: string | null;
  verified?: boolean;
  verification?: {
    checkedAt?: Timestamp | Date | null;
    [key: string]: unknown;
  } | null;
  verifiedAt?: Timestamp | Date | null;
  [key: string]: unknown;
}

interface FirestoreUserData {
  avgRating?: number;
  reviewsCount?: number;
  lastActiveAt?: Timestamp | Date;
  email: string;
  name?: string | null;
  slug?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  location?: {
    postcode?: string | null;
    town?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  postcode?: string | null;
  town?: string | null;
  address?: string | null;
  businessName?: string | null;
  serviceAreas?: string[] | null;
  specialties?: string[];
  experience?: unknown;
  description?: string | null;
  hourlyRate?: unknown;
  profilePicture?: string | null;
  portfolio?: string[];
  searchKeywords?: string[];
  certifications?: Record<string, FirestoreCertification>;
  favoriteTradespeople?: string[];
  subscriptionTier?: string;
  stripeCustomerId?: string | null;
  stripeConnectAccountId?: string | null;
  stripeOnboardingComplete?: boolean;
  subscriptionStatus?: string | null;
  status?: string;
  monthlyQuotesUsed?: number;
  quoteResetDate?: Timestamp | Date | null;
  notificationSettings?: {
    newJobAlerts?: boolean;
    [key: string]: unknown;
  };
  role?: string;
  emailVerified?: boolean | Timestamp | Date;
  termsAcceptedAt?: Timestamp | Date;
  onboardingComplete?: boolean;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  lastLoginAt?: Timestamp | Date;
  isFeatured?: boolean;
  featureExpiresAt?: Timestamp | Date;
  [key: string]: unknown;
}

const tsToDate = (value: Timestamp | Date | null | undefined): Date | null | undefined => {
  if (typeof value === "object" && value !== null) {
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
  }
  return value ?? undefined;
};

export function mapToUser(id: string, data: Record<string, unknown>): User {
  const d = data as FirestoreUserData;

  let emailVerifiedDate: Date | null = null;
  if (d.emailVerified) {
    if (typeof d.emailVerified === "object" && d.emailVerified instanceof Timestamp) {
      emailVerifiedDate = d.emailVerified.toDate();
    } else if (typeof d.emailVerified === "object" && d.emailVerified instanceof Date) {
      emailVerifiedDate = d.emailVerified;
    } else if (typeof d.emailVerified === "boolean" && d.emailVerified) {
      emailVerifiedDate = tsToDate(d.updatedAt) ?? new Date();
    }
  }

  return {
    id,
    avgRating: typeof d.avgRating === "number" ? d.avgRating : null,
    reviewsCount: typeof d.reviewsCount === "number" ? d.reviewsCount : null,
    lastActiveAt: tsToDate(d.lastActiveAt) ?? undefined,
    email: d.email,
    name: d.name || null,
    slug: d.slug || undefined,
    firstName: d.firstName || null,
    lastName: d.lastName || null,
    phone: d.phone || null,
    location: {
      postcode: d.location?.postcode ?? d.postcode ?? null,
      town: d.location?.town ?? d.town ?? null,
      address: d.location?.address ?? d.address ?? null,
      latitude: d.location?.latitude ?? null,
      longitude: d.location?.longitude ?? null
    },
    businessName: d.businessName || null,
    serviceAreas: Array.isArray(d.serviceAreas)
      ? d.serviceAreas.join(", ")
      : (d.serviceAreas as unknown as string) || null,
    specialties: d.specialties || [],
    experience: typeof d.experience === "string" ? d.experience : null,
    description: d.description || null,
    hourlyRate: typeof d.hourlyRate === "string" ? d.hourlyRate : null,
    profilePicture: d.profilePicture || null,
    portfolio: d.portfolio || [],
    searchKeywords: d.searchKeywords || [],
    certifications: d.certifications
      ? Object.entries(d.certifications).map(([certId, cert]) => {
          const c = cert as FirestoreCertification;
          const verification = c.verification
            ? {
                ...c.verification,
                checkedAt: tsToDate(c.verification.checkedAt) ?? null
              }
            : (c.verification ?? null);

          return {
            id: certId,
            name: c.name,
            issuingBody: c.issuingBody,
            fileUrl: c.fileUrl ?? null,
            verified: c.verified,
            verifiedAt: tsToDate(c.verifiedAt) ?? null,
            verification
          } as Certification;
        })
      : [],
    favoriteTradespeople: d.favoriteTradespeople || [],
    notificationSettings: d.notificationSettings
      ? {
          newJobAlerts:
            typeof d.notificationSettings.newJobAlerts === "boolean" ? d.notificationSettings.newJobAlerts : undefined
        }
      : undefined,
    subscriptionTier: (d.subscriptionTier as User["subscriptionTier"]) || "basic",
    stripeCustomerId: d.stripeCustomerId || null,
    stripeConnectAccountId: d.stripeConnectAccountId || null,
    stripeOnboardingComplete: d.stripeOnboardingComplete ?? false,
    subscriptionStatus: (d.subscriptionStatus as User["subscriptionStatus"]) || null,
    status: (d.status as User["status"]) || "active",
    monthlyQuotesUsed: d.monthlyQuotesUsed ?? 0,
    quoteResetDate: tsToDate(d.quoteResetDate) ?? null,
    role: (d.role as UserRole) || "customer",
    emailVerified: emailVerifiedDate,
    termsAcceptedAt: tsToDate(d.termsAcceptedAt) ?? undefined,
    onboardingComplete: d.onboardingComplete || false,
    createdAt: tsToDate(d.createdAt) ?? new Date(),
    updatedAt: tsToDate(d.updatedAt) ?? new Date(),
    lastLoginAt: tsToDate(d.lastLoginAt) ?? undefined,
    isFeatured: d.isFeatured ?? false,
    featureExpiresAt: tsToDate(d.featureExpiresAt) ?? undefined
  };
}

const keywordMap: { [key: string]: string[] } = {
  "boiler repair": [
    "boiler",
    "heating",
    "gas",
    "vaillant",
    "worcester bosch",
    "baxi",
    "ideal",
    "no hot water",
    "pressure"
  ],
  "gas safety checks": ["gas safe", "landlord certificate", "cp12"],
  "leak detection": ["leak", "leaking", "pipe", "water damage", "damp"],
  "bathroom tiling": ["tiler", "tiling", "grouting", "ceramics", "bathroom fitters"],
  "floor tiling": ["tiler", "tiling", "floor", "kitchen"]
};

export function generateKeywords(data: Partial<User>): string[] {
  const keywords = new Set<string>();

  keywords.add("tradesperson");
  if (data.role === "tradesperson") {
    keywords.add("plumber");
    keywords.add("plumbing");
  }

  const fieldsToProcess = [data.businessName, data.name, data.location?.town];
  for (const field of fieldsToProcess) {
    if (field) {
      field
        .toLowerCase()
        .split(/\s+/)
        .forEach(word => keywords.add(word));
    }
  }

  if (data.specialties) {
    for (const specialty of data.specialties) {
      const specialtyKey = specialty.toLowerCase();
      specialtyKey.split(/\s+/).forEach(word => keywords.add(word));

      if (keywordMap[specialtyKey]) {
        keywordMap[specialtyKey].forEach(keyword => keywords.add(keyword));
      }
    }
  }

  return Array.from(keywords).filter(Boolean);
}

export function score(u: Pick<User, "avgRating" | "reviewsCount">) {
  const k = 15;
  const r = u.avgRating ?? 0;
  const n = u.reviewsCount ?? 0;
  return (n / (n + k)) * r + (k / (n + k)) * 3.8;
}
