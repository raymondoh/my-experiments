/**
 * Environment variable access helpers for the App Router.
 * Server-only code should import `serverEnv`; client components should import `clientEnv`.
 */
import { z } from "zod";

const isTestEnv = process.env.NODE_ENV === "test";
const isBrowser = typeof window !== "undefined";

const serverSchema = z.object({
  /** Stripe secret key used for privileged Stripe API calls on the server. */
  STRIPE_SECRET_KEY: z
    .string({ required_error: "STRIPE_SECRET_KEY is required" })
    .min(1, "STRIPE_SECRET_KEY cannot be empty"),
  /** Stripe webhook signing secret for validating incoming Stripe webhooks. */
  STRIPE_WEBHOOK_SECRET: z
    .string({ required_error: "STRIPE_WEBHOOK_SECRET is required" })
    .min(1, "STRIPE_WEBHOOK_SECRET cannot be empty"),
  /** Firebase project identifier shared across Firebase services. */
  FIREBASE_PROJECT_ID: z
    .string({ required_error: "FIREBASE_PROJECT_ID is required" })
    .min(1, "FIREBASE_PROJECT_ID cannot be empty"),
  /** Firebase service account email used for Admin SDK authentication. */
  FIREBASE_CLIENT_EMAIL: z
    .string({ required_error: "FIREBASE_CLIENT_EMAIL is required" })
    .email("FIREBASE_CLIENT_EMAIL must be a valid email"),
  /** Firebase Admin private key used to authenticate server-side operations. */
  FIREBASE_PRIVATE_KEY: z
    .string({ required_error: "FIREBASE_PRIVATE_KEY is required" })
    .min(1, "FIREBASE_PRIVATE_KEY cannot be empty")
    .transform((value) => value.replace(/\\n/g, "\n")),
  /** Firebase storage bucket for server-side uploads and downloads. */
  FIREBASE_STORAGE_BUCKET: z
    .string({ required_error: "FIREBASE_STORAGE_BUCKET is required" })
    .min(1, "FIREBASE_STORAGE_BUCKET cannot be empty"),
  /** Google OAuth client ID for NextAuth server configuration. */
  AUTH_GOOGLE_CLIENT_ID: z
    .string({ required_error: "AUTH_GOOGLE_CLIENT_ID is required" })
    .min(1, "AUTH_GOOGLE_CLIENT_ID cannot be empty"),
  /** Google OAuth client secret for NextAuth server configuration. */
  AUTH_GOOGLE_CLIENT_SECRET: z
    .string({ required_error: "AUTH_GOOGLE_CLIENT_SECRET is required" })
    .min(1, "AUTH_GOOGLE_CLIENT_SECRET cannot be empty"),
  /** Resend API key for transactional email delivery. */
  RESEND_API_KEY: z
    .string({ required_error: "RESEND_API_KEY is required" })
    .min(1, "RESEND_API_KEY cannot be empty"),
  /** Mailchimp API key for marketing email integrations. */
  MAILCHIMP_API_KEY: z
    .string({ required_error: "MAILCHIMP_API_KEY is required" })
    .min(1, "MAILCHIMP_API_KEY cannot be empty"),
  /** Mailchimp server prefix (e.g., us21) used in Mailchimp API URLs. */
  MAILCHIMP_SERVER_PREFIX: z
    .string({ required_error: "MAILCHIMP_SERVER_PREFIX is required" })
    .min(1, "MAILCHIMP_SERVER_PREFIX cannot be empty"),
  /** Mailchimp audience/list identifier for subscribing new contacts. */
  MAILCHIMP_AUDIENCE_ID: z
    .string({ required_error: "MAILCHIMP_AUDIENCE_ID is required" })
    .min(1, "MAILCHIMP_AUDIENCE_ID cannot be empty"),
  /** Upstash Redis REST endpoint for server-side data access. */
  UPSTASH_REDIS_REST_URL: z
    .string()
    .min(1, "UPSTASH_REDIS_REST_URL cannot be empty")
    .url("UPSTASH_REDIS_REST_URL must be a valid URL")
    .optional(),
  /** Upstash Redis REST token used to authorize requests. */
  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .min(1, "UPSTASH_REDIS_REST_TOKEN cannot be empty")
    .optional(),
  /** Canonical site URL used for SEO metadata. */
  SITE_URL: z
    .string()
    .min(1, "SITE_URL cannot be empty")
    .url("SITE_URL must be a valid URL")
    .optional(),
  /** Default Open Graph image URL for sharing previews. */
  OG_IMAGE_URL: z
    .string()
    .min(1, "OG_IMAGE_URL cannot be empty")
    .url("OG_IMAGE_URL must be a valid URL")
    .optional(),
  /** Twitter/X handle for social sharing metadata (e.g., @motostix). */
  SITE_TWITTER: z
    .string()
    .min(1, "SITE_TWITTER cannot be empty")
    .optional(),
});

const clientSchema = z.object({
  /** Public base URL for the application used in client-side routing. */
  NEXT_PUBLIC_APP_URL: z
    .string({ required_error: "NEXT_PUBLIC_APP_URL is required" })
    .min(1, "NEXT_PUBLIC_APP_URL cannot be empty")
    .url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  /** Stripe publishable key available to the client for Checkout. */
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string({ required_error: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required" })
    .min(1, "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY cannot be empty"),
  /** Firebase client API key for initializing the Firebase SDK. */
  NEXT_PUBLIC_FIREBASE_API_KEY: z
    .string({ required_error: "NEXT_PUBLIC_FIREBASE_API_KEY is required" })
    .min(1, "NEXT_PUBLIC_FIREBASE_API_KEY cannot be empty"),
  /** Firebase auth domain used by the Firebase client SDK. */
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z
    .string({ required_error: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is required" })
    .min(1, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN cannot be empty"),
  /** Firebase project identifier exposed to the client SDK. */
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z
    .string({ required_error: "NEXT_PUBLIC_FIREBASE_PROJECT_ID is required" })
    .min(1, "NEXT_PUBLIC_FIREBASE_PROJECT_ID cannot be empty"),
  /** Firebase storage bucket name used for client uploads. */
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z
    .string({ required_error: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is required" })
    .min(1, "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET cannot be empty"),
  /** Firebase Cloud Messaging sender ID required for push notifications. */
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z
    .string({ required_error: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID is required" })
    .min(1, "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID cannot be empty"),
  /** Firebase application ID for initializing Firebase on the client. */
  NEXT_PUBLIC_FIREBASE_APP_ID: z
    .string({ required_error: "NEXT_PUBLIC_FIREBASE_APP_ID is required" })
    .min(1, "NEXT_PUBLIC_FIREBASE_APP_ID cannot be empty"),
});

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

const testServerDefaults: ServerEnv = {
  STRIPE_SECRET_KEY: "sk_test_placeholder",
  STRIPE_WEBHOOK_SECRET: "whsec_test_placeholder",
  FIREBASE_PROJECT_ID: "test-project",
  FIREBASE_CLIENT_EMAIL: "service-account@test.local",
  FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----\n",
  FIREBASE_STORAGE_BUCKET: "test-project.appspot.com",
  AUTH_GOOGLE_CLIENT_ID: "google-client-id.test",
  AUTH_GOOGLE_CLIENT_SECRET: "google-client-secret",
  RESEND_API_KEY: "resend_test_key",
  MAILCHIMP_API_KEY: "mailchimp_test_key",
  MAILCHIMP_SERVER_PREFIX: "us1",
  MAILCHIMP_AUDIENCE_ID: "audience_test_id",
  UPSTASH_REDIS_REST_URL: undefined,
  UPSTASH_REDIS_REST_TOKEN: undefined,
  SITE_URL: undefined,
  OG_IMAGE_URL: undefined,
  SITE_TWITTER: undefined,
};

const testClientDefaults: ClientEnv = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_placeholder",
  NEXT_PUBLIC_FIREBASE_API_KEY: "firebase_test_api_key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "test-project.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "test-project",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "test-project.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "000000000000",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:000000000000:web:test",
};

const parseOrFallback = <Schema extends z.ZodTypeAny>(
  schema: Schema,
  data: unknown,
  fallback: z.infer<Schema>,
): z.infer<Schema> => {
  const result = schema.safeParse(data);

  if (result.success) {
    return result.data;
  }

  if (isTestEnv) {
    console.warn(
      "[env] Using test fallbacks due to invalid environment variables:\n" +
        result.error.toString(),
    );

    return fallback;
  }

  throw new Error("[env] Invalid environment variables:\n" + result.error.toString());
};

const rawEnv = process.env;

export const clientEnv: ClientEnv = parseOrFallback(
  clientSchema,
  {
    NEXT_PUBLIC_APP_URL: rawEnv.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: rawEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_FIREBASE_API_KEY: rawEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: rawEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: rawEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: rawEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: rawEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: rawEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
  testClientDefaults,
);

const createServerEnv = (): ServerEnv => {
  if (isBrowser) {
    return new Proxy(
      {},
      {
        get() {
          throw new Error(
            "serverEnv is not available in the browser. Import clientEnv for client-side usage.",
          );
        },
      },
    ) as ServerEnv;
  }

  return parseOrFallback(
    serverSchema,
    {
      STRIPE_SECRET_KEY: rawEnv.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: rawEnv.STRIPE_WEBHOOK_SECRET,
      FIREBASE_PROJECT_ID: rawEnv.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: rawEnv.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: rawEnv.FIREBASE_PRIVATE_KEY,
      FIREBASE_STORAGE_BUCKET: rawEnv.FIREBASE_STORAGE_BUCKET,
      AUTH_GOOGLE_CLIENT_ID: rawEnv.AUTH_GOOGLE_CLIENT_ID,
      AUTH_GOOGLE_CLIENT_SECRET: rawEnv.AUTH_GOOGLE_CLIENT_SECRET,
      RESEND_API_KEY: rawEnv.RESEND_API_KEY,
      MAILCHIMP_API_KEY: rawEnv.MAILCHIMP_API_KEY,
      MAILCHIMP_SERVER_PREFIX: rawEnv.MAILCHIMP_SERVER_PREFIX,
      MAILCHIMP_AUDIENCE_ID: rawEnv.MAILCHIMP_AUDIENCE_ID,
      UPSTASH_REDIS_REST_URL: rawEnv.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: rawEnv.UPSTASH_REDIS_REST_TOKEN,
      SITE_URL: rawEnv.SITE_URL,
      OG_IMAGE_URL: rawEnv.OG_IMAGE_URL,
      SITE_TWITTER: rawEnv.SITE_TWITTER,
    },
    testServerDefaults,
  );
};

export const serverEnv = createServerEnv();

export const isProd = process.env.NODE_ENV === "production";
export const appUrl = clientEnv.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type { ServerEnv, ClientEnv };
