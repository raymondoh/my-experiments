// src/lib/stripe/server.ts
import Stripe from "stripe";

// Fail fast if the key is missing
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY env var");
}

declare global {
  // Avoid re-instantiating Stripe during dev/hot-reload
   
  var _stripeSingleton: Stripe | undefined;
}

export const stripe: Stripe =
  globalThis._stripeSingleton ??
  new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2024-04-10"
  });

if (!globalThis._stripeSingleton) {
  globalThis._stripeSingleton = stripe;
}

// Fail fast if webhook secret is missing (only used by webhook route)
export const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
