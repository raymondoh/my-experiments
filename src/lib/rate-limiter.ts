import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RatelimitOptions = ConstructorParameters<typeof Ratelimit>[0];
type RateLimiter = Pick<Ratelimit, "limit">;

const missingRedisCredentials =
  !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = missingRedisCredentials
  ? undefined
  : new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

let warnedAboutMissingCredentials = false;

const warnMissingCredentials = () => {
  if (warnedAboutMissingCredentials) return;
  warnedAboutMissingCredentials = true;

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "Upstash Redis credentials are not set. Falling back to a no-op rate limiter."
    );
  }
};

const createRateLimiter = (options: Omit<RatelimitOptions, "redis">): RateLimiter => {
  if (redis) {
    return new Ratelimit({
      ...options,
      redis,
    });
  }

  warnMissingCredentials();

  const fallbackLimit: RateLimiter["limit"] = async () => ({
    success: true,
    limit: 0,
    remaining: 0,
    reset: Date.now(),
    pending: Promise.resolve(),
  });

  return {
    limit: fallbackLimit,
  } satisfies RateLimiter;
};

// A strict rate limiter for sensitive actions like login and password reset.
// Allows 5 requests per 10 seconds from a single IP.
export const strictRateLimiter = createRateLimiter({
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

// A more lenient rate limiter for general API usage.
// Allows 10 requests per 10 seconds from a single IP.
export const standardRateLimiter = createRateLimiter({
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});
