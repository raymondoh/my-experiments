import type { Query, Timestamp } from "firebase-admin/firestore";

import { FieldValue, getAdminFirestore } from "@/lib/firebase/server";
import { createLogger } from "@/lib/logger";

export type OrderId = string;
export type OrderStatus =
  | "created"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "canceled"
  | "refunded"
  | "failed";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
}

export interface Order {
  id: OrderId;
  userId: string | null;
  email: string;
  items: OrderItem[];
  currency: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  stripePaymentIntentId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripeEventId?: string | null;
  createdAtISO: string;
  updatedAtISO?: string;
  metadata?: Record<string, string | number | boolean | null>;
  shippingAddress?: {
    name?: string;
    line1?: string;
    line2?: string | null;
    city?: string;
    state?: string | null;
    postal_code?: string;
    country?: string;
  } | null;
}

export interface ListOrdersParams {
  userId?: string;
  limit?: number;
  cursor?: string | null;
  status?: OrderStatus | "any";
}

export interface ListOrdersResult {
  items: Order[];
  nextCursor: string | null;
}

interface OrderDocument {
  userId: string | null;
  email: string;
  items: OrderItem[];
  currency: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  stripePaymentIntentId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripeEventId?: string | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  metadata?: Record<string, string | number | boolean | null> | null;
  shippingAddress?: Order["shippingAddress"];
}

interface ProductSnapshot {
  price: number;
  name: string;
  image?: string | null;
}

type StripeEventRecord = {
  orderId: OrderId | null;
  createdAt: Timestamp | FirebaseFirestore.FieldValue;
  type?: string;
};

const ORDERS_COLLECTION = "orders";
const STRIPE_EVENTS_COLLECTION = "stripe_events";
const PRODUCTS_COLLECTION = "products";
const MAX_LIST_LIMIT = 50;
const DEFAULT_LIST_LIMIT = 20;

const log = createLogger("services.orders");

const toISO = (value: Timestamp | Date | string | null | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    const asDate = new Date(value);
    return Number.isNaN(asDate.getTime()) ? value : asDate.toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value.toDate().toISOString();
};

const toCurrencyCents = (value: number): number => {
  return Math.round(value * 100);
};

const fromCurrencyCents = (value: number): number => {
  return Math.round(value) / 100;
};

const mapOrderDocument = (id: string, data: OrderDocument): Order => {
  return {
    id,
    userId: data.userId ?? null,
    email: data.email,
    items: (data.items ?? []).map((item) => ({
      ...item,
      image: item.image ?? null,
    })),
    currency: data.currency,
    subtotal: data.subtotal,
    shipping: data.shipping,
    total: data.total,
    status: data.status,
    stripePaymentIntentId: data.stripePaymentIntentId ?? null,
    stripeCheckoutSessionId: data.stripeCheckoutSessionId ?? null,
    stripeEventId: data.stripeEventId ?? null,
    createdAtISO: toISO(data.createdAt) ?? new Date().toISOString(),
    updatedAtISO: toISO(data.updatedAt),
    metadata: data.metadata,
    shippingAddress: data.shippingAddress ?? null,
  };
};

const fetchProductSnapshot = async (productId: string): Promise<ProductSnapshot | null> => {
  const db = getAdminFirestore();
  try {
    const snapshot = await db.collection(PRODUCTS_COLLECTION).doc(productId).get();
    if (!snapshot.exists) {
      log.warn("product snapshot missing", { productId });
      return null;
    }

    const data = snapshot.data() as Record<string, unknown> | undefined;
    if (!data) {
      return null;
    }

    const onSale = typeof data.onSale === "boolean" ? data.onSale : false;
    const salePrice = typeof data.salePrice === "number" ? data.salePrice : undefined;
    const price = typeof data.price === "number" ? data.price : 0;

    const resolvedPrice = onSale && typeof salePrice === "number" ? salePrice : price;

    const images = Array.isArray(data.images) ? (data.images as string[]) : [];
    const image = typeof data.image === "string" ? data.image : images[0] ?? null;

    return {
      name: typeof data.name === "string" ? data.name : productId,
      price: resolvedPrice,
      image,
    };
  } catch (error) {
    log.error("product snapshot fetch failed", error, { productId });
    return null;
  }
};

const parseMetadata = (
  metadata?: Record<string, string | number | boolean | null>,
): Record<string, string | number | boolean | null> | undefined => {
  if (!metadata) {
    return undefined;
  }

  return Object.entries(metadata).reduce<Record<string, string | number | boolean | null>>((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});
};

export async function createOrderFromStripeSession(input: {
  sessionId: string;
  paymentIntentId?: string | null;
  email: string;
  userId?: string | null;
  currency: string;
  lineItems: Array<{
    productId: string;
    name: string;
    unitAmount: number;
    quantity: number;
    image?: string | null;
  }>;
  shipping?: number;
  metadata?: Record<string, string | number | boolean | null>;
  stripeEventId?: string;
  shippingAddress?: Order["shippingAddress"];
  paymentStatus?: "paid" | "unpaid" | "no_payment_required" | null;
}): Promise<OrderId> {
  const db = getAdminFirestore();
  const ordersRef = db.collection(ORDERS_COLLECTION);

  const shippingAmountCents = toCurrencyCents(input.shipping ?? 0);

  const resolvedItems = await Promise.all(
    input.lineItems.map(async (item) => {
      const snapshot = await fetchProductSnapshot(item.productId);
      if (!snapshot) {
        const fallbackPriceCents = toCurrencyCents(item.unitAmount);
        log.warn("using fallback price for item", {
          productId: item.productId,
          sessionId: input.sessionId,
        });
        return {
          productId: item.productId,
          name: item.name,
          priceCents: fallbackPriceCents,
          quantity: item.quantity,
          image: item.image ?? null,
        };
      }

      return {
        productId: item.productId,
        name: snapshot.name,
        priceCents: toCurrencyCents(snapshot.price),
        quantity: item.quantity,
        image: snapshot.image ?? item.image ?? null,
      };
    }),
  );

  const subtotalCents = resolvedItems.reduce((acc, item) => acc + item.priceCents * item.quantity, 0);
  const totalCents = subtotalCents + shippingAmountCents;

  const stripeEventId = input.stripeEventId ?? null;
  const paymentIntentId = input.paymentIntentId ?? null;
  const metadata = parseMetadata(input.metadata);
  const paymentStatus = input.paymentStatus ?? null;

  const transactionResult = await db.runTransaction(async (tx) => {
    if (stripeEventId) {
      const eventRef = db.collection(STRIPE_EVENTS_COLLECTION).doc(stripeEventId);
      const eventDoc = await tx.get(eventRef);
      if (eventDoc.exists) {
        const data = eventDoc.data() as StripeEventRecord | undefined;
        if (data?.orderId) {
          return data.orderId;
        }
      }
    }

    let existingOrderId: string | null = null;

    const sessionQuery = ordersRef.where("stripeCheckoutSessionId", "==", input.sessionId).limit(1);
    const sessionSnapshot = await tx.get(sessionQuery);
    if (!sessionSnapshot.empty) {
      existingOrderId = sessionSnapshot.docs[0]!.id;
    }

    if (!existingOrderId && paymentIntentId) {
      const paymentIntentQuery = ordersRef
        .where("stripePaymentIntentId", "==", paymentIntentId)
        .limit(1);
      const paymentIntentSnapshot = await tx.get(paymentIntentQuery);
      if (!paymentIntentSnapshot.empty) {
        existingOrderId = paymentIntentSnapshot.docs[0]!.id;
      }
    }

    if (existingOrderId) {
      if (stripeEventId) {
        tx.set(
          db.collection(STRIPE_EVENTS_COLLECTION).doc(stripeEventId),
          {
            orderId: existingOrderId,
            createdAt: FieldValue.serverTimestamp(),
          } satisfies StripeEventRecord,
          { merge: true },
        );
      }
      return existingOrderId;
    }

    const newOrderRef = ordersRef.doc();
    tx.set(newOrderRef, {
      userId: input.userId ?? null,
      email: input.email,
      items: resolvedItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: fromCurrencyCents(item.priceCents),
        quantity: item.quantity,
        image: item.image ?? null,
      })),
      currency: input.currency,
      subtotal: fromCurrencyCents(subtotalCents),
      shipping: fromCurrencyCents(shippingAmountCents),
      total: fromCurrencyCents(totalCents),
      status: paymentStatus === "paid" ? "paid" : "created",
      stripePaymentIntentId: paymentIntentId,
      stripeCheckoutSessionId: input.sessionId,
      stripeEventId,
      metadata: metadata ?? null,
      shippingAddress: input.shippingAddress ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    } satisfies OrderDocument);

    if (stripeEventId) {
      tx.set(
        db.collection(STRIPE_EVENTS_COLLECTION).doc(stripeEventId),
        {
          orderId: newOrderRef.id,
          createdAt: FieldValue.serverTimestamp(),
        } satisfies StripeEventRecord,
        { merge: true },
      );
    }

    return newOrderRef.id;
  });

  return transactionResult;
}

export async function markOrderPaidByPaymentIntent(
  paymentIntentId: string,
  opts?: { stripeEventId?: string },
): Promise<void> {
  if (!paymentIntentId) {
    return;
  }

  const db = getAdminFirestore();
  const ordersRef = db.collection(ORDERS_COLLECTION);

  await db.runTransaction(async (tx) => {
    const eventId = opts?.stripeEventId ?? null;
    if (eventId) {
      const eventRef = db.collection(STRIPE_EVENTS_COLLECTION).doc(eventId);
      const eventDoc = await tx.get(eventRef);
      if (eventDoc.exists) {
        return;
      }
    }

    const query = ordersRef.where("stripePaymentIntentId", "==", paymentIntentId).limit(1);
    const snapshot = await tx.get(query);
    if (snapshot.empty) {
      log.warn("no order found for payment intent", { paymentIntentId });
      if (opts?.stripeEventId) {
        tx.set(
          db.collection(STRIPE_EVENTS_COLLECTION).doc(opts.stripeEventId),
          {
            orderId: null,
            createdAt: FieldValue.serverTimestamp(),
          } as Partial<StripeEventRecord>,
          { merge: true },
        );
      }
      return;
    }

    const doc = snapshot.docs[0]!;
    const data = doc.data() as OrderDocument;

    const updates: Partial<OrderDocument> = {
      status: "paid",
      stripeEventId: opts?.stripeEventId ?? data.stripeEventId ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    };

    tx.update(doc.ref, updates);

    if (opts?.stripeEventId) {
      tx.set(
        db.collection(STRIPE_EVENTS_COLLECTION).doc(opts.stripeEventId),
        {
          orderId: doc.id,
          createdAt: FieldValue.serverTimestamp(),
          type: "payment_intent.succeeded",
        } satisfies StripeEventRecord,
        { merge: true },
      );
    }
  });
}

export async function getOrderById(id: OrderId): Promise<Order | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(ORDERS_COLLECTION).doc(id).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data() as OrderDocument;
  return mapOrderDocument(doc.id, data);
}

export async function listOrders(params: ListOrdersParams): Promise<ListOrdersResult> {
  const db = getAdminFirestore();
  const ordersRef = db.collection(ORDERS_COLLECTION);

  const limit = Math.max(1, Math.min(params.limit ?? DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT));

  let query: Query = ordersRef.orderBy("createdAt", "desc");

  if (params.userId) {
    query = query.where("userId", "==", params.userId);
  }

  if (params.status && params.status !== "any") {
    query = query.where("status", "==", params.status);
  }

  if (params.cursor) {
    try {
      const cursorDoc = await ordersRef.doc(params.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    } catch (error) {
      log.error("failed to apply cursor", error, { cursor: params.cursor });
    }
  }

  const snapshot = await query.limit(limit + 1).get();
  const docs = snapshot.docs.slice(0, limit);
  const items = docs.map((doc) => mapOrderDocument(doc.id, doc.data() as OrderDocument));

  const nextCursor = snapshot.docs.length > limit ? snapshot.docs[limit]!.id : null;

  return { items, nextCursor };
}

export async function updateOrderStatus(id: OrderId, status: OrderStatus): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(ORDERS_COLLECTION).doc(id).update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function getOrderByStripeCheckoutSessionId(sessionId: string): Promise<Order | null> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(ORDERS_COLLECTION)
    .where("stripeCheckoutSessionId", "==", sessionId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0]!;
  return mapOrderDocument(doc.id, doc.data() as OrderDocument);
}

export async function getOrderByStripePaymentIntentId(paymentIntentId: string): Promise<Order | null> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(ORDERS_COLLECTION)
    .where("stripePaymentIntentId", "==", paymentIntentId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0]!;
  return mapOrderDocument(doc.id, doc.data() as OrderDocument);
}

// Required Firestore indexes:
// - Collection: orders, composite index on (userId ASC, createdAt DESC)
// - Collection: orders, single field index on createdAt DESC
