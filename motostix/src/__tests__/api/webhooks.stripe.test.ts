import { NextRequest } from "next/server";

jest.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

const constructEventMock = jest.fn();
const retrieveSessionMock = jest.fn();

jest.mock("@/lib/stripe/server", () => ({
  getStripeServer: jest.fn(() => ({
    webhooks: { constructEvent: constructEventMock },
    checkout: { sessions: { retrieve: retrieveSessionMock } },
  })),
}));

const stripeEventsStore = (globalThis as unknown as { __stripeEventStore?: Map<string, unknown> }).__stripeEventStore ??
  ((globalThis as unknown as { __stripeEventStore: Map<string, unknown> }).__stripeEventStore = new Map());

jest.mock("@/lib/firebase/server", () => ({
  FieldValue: { serverTimestamp: () => new Date() },
  getAdminFirestore: () => ({
    collection: (name: string) => {
      if (name === "stripe_events") {
        return {
          doc: (id: string) => ({
            async get() {
              const data = stripeEventsStore.get(id);
              return {
                exists: data !== undefined,
                data: () => data,
              };
            },
            async set(value: unknown, options?: { merge?: boolean }) {
              const existing = stripeEventsStore.get(id) ?? {};
              stripeEventsStore.set(
                id,
                options?.merge ? { ...(existing as Record<string, unknown>), ...(value as Record<string, unknown>) } : value,
              );
            },
          }),
        };
      }

      return {
        doc: () => ({
          async get() {
            return { exists: false };
          },
          async set() {
            return undefined;
          },
        }),
      };
    },
  }),
}));

jest.mock("@/lib/services/orders", () => ({
  createOrderFromStripeSession: jest.fn(),
  getOrderByStripePaymentIntentId: jest.fn(),
  markOrderPaidByPaymentIntent: jest.fn(),
  updateOrderStatus: jest.fn(),
}));

import { POST } from "@/app/api/webhooks/stripe/route";
import { createOrderFromStripeSession } from "@/lib/services/orders";

const checkoutSession = {
  id: "cs_test_123",
  payment_intent: "pi_test_123",
  payment_status: "paid",
  status: "complete",
  customer_details: { email: "customer@example.com" },
  customer_email: "customer@example.com",
  metadata: { userId: "user_123" },
  currency: "usd",
  shipping_cost: { amount_total: 0 },
  shipping_details: null,
  line_items: {
    data: [
      {
        id: "li_1",
        quantity: 1,
        description: "Moto Helmet",
        amount_total: 4999,
        price: {
          unit_amount: 4999,
          metadata: { productId: "prod_1" },
          product: {
            id: "prod_1",
            metadata: { productId: "prod_1" },
            name: "Moto Helmet",
            images: ["https://example.com/helmet.jpg"],
          },
        },
      },
    ],
  },
};

const stripeEvent = {
  id: "evt_123",
  type: "checkout.session.completed",
  data: { object: checkoutSession },
};

const payload = JSON.stringify(stripeEvent);

const buildRequest = () =>
  new NextRequest("https://example.com/api/webhooks/stripe", {
    method: "POST",
    body: payload,
    headers: { "stripe-signature": "sig_header" },
  });

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    stripeEventsStore.clear();
    constructEventMock.mockReset();
    retrieveSessionMock.mockReset();
    jest.mocked(createOrderFromStripeSession).mockReset();
  });

  it("invokes order creation only once when duplicate events are delivered", async () => {
    constructEventMock.mockReturnValue(stripeEvent);
    retrieveSessionMock.mockResolvedValue(checkoutSession);
    jest.mocked(createOrderFromStripeSession).mockResolvedValue("order_123");

    const firstResponse = await POST(buildRequest());
    expect(firstResponse.status).toBe(200);

    const secondResponse = await POST(buildRequest());
    expect(secondResponse.status).toBe(200);

    expect(createOrderFromStripeSession).toHaveBeenCalledTimes(1);
    expect(retrieveSessionMock).toHaveBeenCalledTimes(1);
  });
});
