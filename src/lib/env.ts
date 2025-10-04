import { z } from "zod";

export const env = {
  AUTH_FIREBASE_PROJECT_ID: process.env.AUTH_FIREBASE_PROJECT_ID,
  AUTH_FIREBASE_CLIENT_EMAIL: process.env.AUTH_FIREBASE_CLIENT_EMAIL,
  AUTH_FIREBASE_PRIVATE_KEY: process.env.AUTH_FIREBASE_PRIVATE_KEY,

  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,

  NODE_ENV: process.env.NODE_ENV,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID,
  STRIPE_BUSINESS_PRICE_ID: process.env.STRIPE_BUSINESS_PRICE_ID,
  STRIPE_BASIC_PRICE_ID: process.env.STRIPE_BASIC_PRICE_ID,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  STRIPE_PRO_PRICE_ID_YEARLY: process.env.STRIPE_PRO_PRICE_ID_YEARLY,
  STRIPE_BUSINESS_PRICE_ID_YEARLY: process.env.STRIPE_BUSINESS_PRICE_ID_YEARLY,
  STRIPE_SUCCESS_URL: process.env.STRIPE_SUCCESS_URL,
  STRIPE_CANCEL_URL: process.env.STRIPE_CANCEL_URL,
  ALERT_WEBHOOK_URL: process.env.ALERT_WEBHOOK_URL,
  STRIPE_PLATFORM_FEE_BPS: process.env.STRIPE_PLATFORM_FEE_BPS,
  STRIPE_REMINDER_CRON_SECRET: process.env.STRIPE_REMINDER_CRON_SECRET
};

export const isBuildTime = typeof window === "undefined" && process.env.NODE_ENV === "production";

const requiredEnv = z.object({
  AUTH_FIREBASE_PROJECT_ID: z.string().min(1),
  AUTH_FIREBASE_CLIENT_EMAIL: z.string().min(1),
  AUTH_FIREBASE_PRIVATE_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().min(1),
  STRIPE_PRO_PRICE_ID: z.string().min(1),
  STRIPE_PRO_PRICE_ID_YEARLY: z.string().min(1),
  STRIPE_BUSINESS_PRICE_ID: z.string().min(1),
  STRIPE_BUSINESS_PRICE_ID_YEARLY: z.string().min(1),
  STRIPE_SUCCESS_URL: z.string().min(1),
  STRIPE_CANCEL_URL: z.string().min(1),
  STRIPE_PLATFORM_FEE_BPS: z.string().min(1)
});

const optionalEnv = z.object({
  STRIPE_BASIC_PRICE_ID: z.string().min(1).optional(),
  ALERT_WEBHOOK_URL: z.string().min(1).optional(),
  STRIPE_REMINDER_CRON_SECRET: z.string().min(1).optional()
});

const envSchema = requiredEnv.merge(optionalEnv);

export function validateEnv() {
  if (isBuildTime) return true;
  // We need to use process.env here directly for validation
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = Object.keys(result.error.flatten().fieldErrors);
    throw new Error(`Missing or invalid environment variables: ${missing.join(", ")}`);
  }
  return true;
}
