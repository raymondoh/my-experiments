import type { ReactNode } from "react";
import Link from "next/link";
import type Stripe from "stripe";

import { ClearCartClient } from "@/components/checkout/ClearCartClient";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Button } from "@/components/ui/button";
import { createLogger } from "@/lib/logger";
import { pageMetadata } from "@/lib/seo";
import { getCheckoutSession } from "@/lib/stripe/server";
import {
  getOrderByStripeCheckoutSessionId,
  getOrderByStripePaymentIntentId,
  type Order,
} from "@/lib/services/orders";

export const metadata = {
  ...pageMetadata({ title: "Order confirmed", path: "/checkout/success" }),
  robots: {
    index: false,
    follow: false,
  },
};

export const revalidate = 5;

const log = createLogger("app.checkout.success");
const RETRY_DELAY_MS = 1000;

type CheckoutSuccessPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

const getFirstParam = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const isSessionComplete = (session: Stripe.Checkout.Session): boolean => {
  const paymentStatus = session.payment_status;
  return (
    paymentStatus === "paid" ||
    paymentStatus === "no_payment_required" ||
    session.status === "complete"
  );
};

const resolvePaymentIntentId = (session: Stripe.Checkout.Session): string | null => {
  const paymentIntent = session.payment_intent;
  if (!paymentIntent) {
    return null;
  }

  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id ?? null;
};

async function findOrderForSession(session: Stripe.Checkout.Session): Promise<Order | null> {
  const fromSession = await getOrderByStripeCheckoutSessionId(session.id);
  if (fromSession) {
    return fromSession;
  }

  const paymentIntentId = resolvePaymentIntentId(session);
  if (paymentIntentId) {
    return getOrderByStripePaymentIntentId(paymentIntentId);
  }

  return null;
}

async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function PageContainer({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full items-center justify-center px-6 py-16">
      <ClearCartClient />
      {children}
    </main>
  );
}

function MissingSessionMessage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 text-center">
      <p className="text-lg font-medium">No checkout session found.</p>
      <p className="text-sm text-muted-foreground">
        If you completed a purchase, check your email for a receipt or return home to start a new order.
      </p>
      <Button asChild>
        <Link href="/">Return home</Link>
      </Button>
    </div>
  );
}

function PendingPaymentMessage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 text-center">
      <p className="text-lg font-medium">Payment is still processing</p>
      <p className="text-sm text-muted-foreground">
        We&apos;re waiting for Stripe to confirm your payment. This page will refresh automatically, or you can check back in a
        moment.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}

function FinalizingOrderMessage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
      <p className="text-lg font-medium">Finalizing your order…</p>
      <p className="text-sm text-muted-foreground">
        We&apos;re syncing with our order system. This page refreshes about every 5 seconds until your receipt is ready.
      </p>
    </div>
  );
}

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const sessionId = getFirstParam(searchParams.session_id);

  if (!sessionId) {
    return (
      <PageContainer>
        <MissingSessionMessage />
      </PageContainer>
    );
  }

  const session = await getCheckoutSession(sessionId);

  if (!session) {
    log.warn("checkout session not found", { sessionId });
    return (
      <PageContainer>
        <MissingSessionMessage />
      </PageContainer>
    );
  }

  if (!isSessionComplete(session)) {
    return (
      <PageContainer>
        <PendingPaymentMessage />
      </PageContainer>
    );
  }

  let order = await findOrderForSession(session);

  if (!order) {
    await wait(RETRY_DELAY_MS);
    order = await findOrderForSession(session);
  }

  if (!order) {
    return (
      <PageContainer>
        <FinalizingOrderMessage />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <OrderSummary order={order} />
    </PageContainer>
  );
}
