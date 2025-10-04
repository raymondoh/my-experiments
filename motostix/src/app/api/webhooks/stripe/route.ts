import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { serverEnv } from "@/lib/env";
import { getStripeServer } from "@/lib/stripe/server";
import {
  createOrderFromStripeSession,
  getOrderByStripePaymentIntentId,
  markOrderPaidByPaymentIntent,
  updateOrderStatus,
} from "@/lib/services/orders";
import { FieldValue, getAdminFirestore } from "@/lib/firebase/server";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.webhooks.stripe");
const stripe = getStripeServer();

const normalizeMetadata = (
  metadata: Stripe.Metadata | null | undefined,
): Record<string, string | number | boolean | null> | undefined => {
  if (!metadata) {
    return undefined;
  }

  const result: Record<string, string | number | boolean | null> = {};
  for (const key of Object.keys(metadata)) {
    const value = metadata[key];
    if (value === "true" || value === "false") {
      result[key] = value === "true";
    } else if (value === "null") {
      result[key] = null;
    } else if (value !== undefined && value !== null && value !== "") {
      const numeric = Number(value);
      result[key] = Number.isNaN(numeric) ? value : numeric;
    } else {
      result[key] = value ?? null;
    }
  }

  return result;
};

const mapLineItems = (lineItems: Stripe.LineItem[]): {
  productId: string;
  name: string;
  unitAmount: number;
  quantity: number;
  image?: string | null;
}[] => {
  return lineItems.map((item) => {
    const price = item.price;
    const product = price?.product;

    const stripeProduct = typeof product === "object" && product !== null ? (product as Stripe.Product) : null;

    const metadataProductId = price?.metadata?.productId ?? stripeProduct?.metadata?.productId;
    const productId = metadataProductId || (typeof product === "string" ? product : stripeProduct?.id) || item.id;

    const unitAmountMinor = price?.unit_amount ?? (price?.unit_amount_decimal ? Number(price.unit_amount_decimal) : null);
    const quantity = item.quantity ?? 1;
    const unitAmount = unitAmountMinor !== null && unitAmountMinor !== undefined
      ? Number(unitAmountMinor) / 100
      : item.amount_total
      ? (item.amount_total / 100) / Math.max(quantity, 1)
      : 0;

    const name = stripeProduct?.name ?? item.description ?? price?.nickname ?? "Item";
    const image = stripeProduct?.images?.[0] ?? null;

    return {
      productId,
      name,
      unitAmount,
      quantity,
      image: image ?? null,
    };
  });
};

const getShippingAddress = (
  shippingDetails: Stripe.Checkout.Session.ShippingDetails | null | undefined,
):
  | {
      name?: string;
      line1?: string;
      line2?: string | null;
      city?: string;
      state?: string | null;
      postal_code?: string;
      country?: string;
    }
  | null => {
  if (!shippingDetails) {
    return null;
  }

  const { address } = shippingDetails;

  return {
    name: shippingDetails.name ?? undefined,
    line1: address?.line1 ?? undefined,
    line2: address?.line2 ?? null,
    city: address?.city ?? undefined,
    state: address?.state ?? null,
    postal_code: address?.postal_code ?? undefined,
    country: address?.country ?? undefined,
  };
};

const recordStripeEvent = async (eventId: string, orderId: string | null, type: string): Promise<void> => {
  const db = getAdminFirestore();
  const ref = db.collection("stripe_events").doc(eventId);
  const existing = await ref.get();

  if (existing.exists) {
    await ref.set(
      {
        orderId,
        type,
      },
      { merge: true },
    );
    return;
  }

  await ref.set({
    orderId,
    type,
    createdAt: FieldValue.serverTimestamp(),
  });
};

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    log.warn("missing signature header");
    return new NextResponse("Missing Stripe signature header", { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, serverEnv.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    log.error("signature verification failed", error);
    return new NextResponse("Webhook signature verification failed", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        log.info("checkout session completed", {
          sessionId: session.id,
          paymentStatus: session.payment_status,
        });

        const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items.data.price.product"],
        });

        const lineItems = mapLineItems(expandedSession.line_items?.data ?? []);

        const orderId = await createOrderFromStripeSession({
          sessionId: expandedSession.id,
          paymentIntentId:
            typeof expandedSession.payment_intent === "string"
              ? expandedSession.payment_intent
              : expandedSession.payment_intent?.id ?? null,
          email:
            expandedSession.customer_details?.email ??
            expandedSession.customer_email ??
            session.customer_details?.email ??
            session.customer_email ??
            "",
          userId: expandedSession.metadata?.userId ?? session.metadata?.userId ?? null,
          currency: expandedSession.currency ?? session.currency ?? "usd",
          lineItems,
          shipping: expandedSession.shipping_cost?.amount_total
            ? expandedSession.shipping_cost.amount_total / 100
            : 0,
          metadata: normalizeMetadata(expandedSession.metadata ?? session.metadata),
          stripeEventId: event.id,
          shippingAddress: getShippingAddress(expandedSession.shipping_details ?? session.shipping_details),
          paymentStatus: expandedSession.payment_status ?? session.payment_status ?? null,
        });

        await recordStripeEvent(event.id, orderId, event.type);
        break;
      }
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        log.info("payment intent succeeded", { paymentIntentId: paymentIntent.id });
        await markOrderPaidByPaymentIntent(paymentIntent.id, { stripeEventId: event.id });
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        log.warn("payment intent failed", { paymentIntentId: paymentIntent.id });
        const order = await getOrderByStripePaymentIntentId(paymentIntent.id);
        if (order) {
          await updateOrderStatus(order.id, "failed");
        }
        await recordStripeEvent(event.id, order ? order.id : null, event.type);
        break;
      }
      default: {
        log.debug("unhandled event", { type: event.type });
      }
    }
  } catch (error) {
    log.error("webhook handler error", error, { eventType: event.type });
    return new NextResponse("Webhook handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
