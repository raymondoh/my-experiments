// src/app/(root)/checkout/success/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";

import { CheckoutSuccessClient } from "@/components/checkout/CheckoutSuccessClient";
import { getOrderByStripeCheckoutSessionId, getOrderByStripePaymentIntentId } from "@/lib/services/orders";
import { siteConfig } from "@/config/siteConfig";

export const metadata: Metadata = {
  title: `Order Confirmation | ${siteConfig.name}`,
  description: "Thank you for your order! Your purchase has been confirmed.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
    },
  },
  other: {
    referrer: "strict-origin-when-cross-origin",
    "cache-control": "no-cache, no-store, must-revalidate",
  },
};

function CheckoutSuccessFallback() {
  return (
    <div className="w-full max-w-md px-4 sm:px-6 mx-auto py-12">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-lg text-muted-foreground">Loading order details...</p>
      </div>
    </div>
  );
}

interface CheckoutSuccessPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

async function resolveOrderId(searchParams: CheckoutSuccessPageProps["searchParams"]): Promise<string | null> {
  const sessionId = typeof searchParams?.session_id === "string" ? searchParams.session_id : undefined;
  if (sessionId) {
    const order = await getOrderByStripeCheckoutSessionId(sessionId);
    if (order) {
      return order.id;
    }
  }

  const paymentIntentIdParam =
    (typeof searchParams?.payment_intent === "string" && searchParams.payment_intent) ||
    (typeof searchParams?.payment_intent_id === "string" && searchParams.payment_intent_id);

  if (paymentIntentIdParam) {
    const order = await getOrderByStripePaymentIntentId(paymentIntentIdParam);
    if (order) {
      return order.id;
    }
  }

  const paymentIntentClientSecret =
    typeof searchParams?.payment_intent_client_secret === "string"
      ? searchParams.payment_intent_client_secret
      : undefined;

  if (paymentIntentClientSecret) {
    const [paymentIntentId] = paymentIntentClientSecret.split("_secret");
    if (paymentIntentId) {
      const order = await getOrderByStripePaymentIntentId(paymentIntentId);
      if (order) {
        return order.id;
      }
    }
  }

  return null;
}

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const orderId = await resolveOrderId(searchParams);

  return (
    <main className="min-h-screen">
      <section className="py-12 md:py-16 w-full bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-secondary rounded-xl shadow-sm border border-border/40 p-6 md:p-8">
              <Suspense fallback={<CheckoutSuccessFallback />}>
                <CheckoutSuccessClient orderId={orderId} />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
