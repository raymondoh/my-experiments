import Stripe from "stripe";

import { serverEnv } from "@/lib/env";

let stripeInstance: Stripe | null = null;

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2025-05-28.basil";

export const getStripeServer = (): Stripe => {
  if (stripeInstance) {
    return stripeInstance;
  }

  stripeInstance = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION,
  });

  return stripeInstance;
};
