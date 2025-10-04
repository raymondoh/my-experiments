import Stripe from "stripe";

import { serverEnv } from "@/lib/env";
import { createLogger } from "@/lib/logger";

let stripeInstance: Stripe | null = null;

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2025-05-28.basil";

const log = createLogger("stripe.server");

export const getStripeServer = (): Stripe => {
  if (stripeInstance) {
    return stripeInstance;
  }

  stripeInstance = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION,
  });

  return stripeInstance;
};

export async function getCheckoutSession(
  sessionId: string,
): Promise<Stripe.Checkout.Session | null> {
  const trimmedId = sessionId.trim();
  if (!trimmedId) {
    return null;
  }

  try {
    const stripe = getStripeServer();
    return await stripe.checkout.sessions.retrieve(trimmedId, {
      expand: ["line_items.data.price.product"],
    });
  } catch (error) {
    log.error("failed to retrieve checkout session", error, { sessionId: trimmedId });
    return null;
  }
}
