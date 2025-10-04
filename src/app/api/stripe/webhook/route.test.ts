jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({
      ...body,
      status: init?.status ?? 200,
      json: async () => body
    })
  }
}));

jest.mock("@/lib/stripe/server", () => ({
  stripe: {
    webhooks: { constructEvent: jest.fn() },
    checkout: { sessions: { retrieve: jest.fn() } },
    paymentIntents: { retrieve: jest.fn() }
  }
}));

jest.mock("@/lib/firebase/admin", () => ({
  UsersCollection: jest.fn(),
  JobsCollection: jest.fn(() => ({
    doc: jest.fn(() => ({
      collection: jest.fn(() => ({ doc: jest.fn(() => ({ set: jest.fn() })) })),
      set: jest.fn()
    }))
  }))
}));

import { stripe } from "@/lib/stripe/server";
import { UsersCollection, JobsCollection } from "@/lib/firebase/admin";
import { POST } from "./route";

describe("stripe webhook route", () => {
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec";
    (stripe.webhooks.constructEvent as jest.Mock).mockReset();
    (UsersCollection as jest.Mock).mockReset();
  });

  it("handles checkout session completion", async () => {
    const update = jest.fn();
    (UsersCollection as jest.Mock).mockReturnValue({ doc: () => ({ update }) });
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          customer: "cus_123",
          metadata: { userId: "user1", tier: "pro" }
        }
      }
    });

    const req: any = { text: async () => "{}", headers: new Headers({ "stripe-signature": "sig" }) };
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ stripeCustomerId: "cus_123", subscriptionTier: "pro" })
    );
  });

  it("returns 400 for invalid signature", async () => {
    (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
      throw new Error("bad sig");
    });

    const req: any = { text: async () => "{}", headers: new Headers({ "stripe-signature": "sig" }) };
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("updates job payment records from payment intent events", async () => {
    const quoteSet = jest.fn();
    const jobSet = jest.fn();
    (JobsCollection as jest.Mock).mockReturnValue({
      doc: () => ({
        collection: () => ({ doc: () => ({ set: quoteSet }) }),
        set: jobSet
      })
    });

    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_1",
          amount: 1000,
          currency: "gbp",
          capture_method: "automatic",
          status: "succeeded",
          metadata: { jobId: "job1", quoteId: "quote1" }
        }
      }
    });

    const req: any = { text: async () => "{}", headers: new Headers({ "stripe-signature": "sig" }) };
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(quoteSet).toHaveBeenCalled();
    expect(jobSet).toHaveBeenCalled();
  });

  it("updates user on subscription changes", async () => {
    const update = jest.fn();
    const get = jest.fn().mockResolvedValue({ empty: false, docs: [{ ref: { update } }] });
    (UsersCollection as jest.Mock).mockReturnValue({ where: () => ({ limit: () => ({ get }) }) });
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          customer: "cus_123",
          status: "active",
          items: { data: [{ price: { id: "price_pro" } }] }
        }
      }
    });

    const req: any = { text: async () => "{}", headers: new Headers({ "stripe-signature": "sig" }) };
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ subscriptionStatus: "active" }));
  });

  it("marks users past due on failed invoices", async () => {
    const update = jest.fn();
    const get = jest.fn().mockResolvedValue({ empty: false, docs: [{ ref: { update } }] });
    (UsersCollection as jest.Mock).mockReturnValue({ where: () => ({ limit: () => ({ get }) }) });
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: "invoice.payment_failed",
      data: { object: { customer: "cus_123" } }
    });

    const req: any = { text: async () => "{}", headers: new Headers({ "stripe-signature": "sig" }) };
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ subscriptionStatus: "past_due" }));
  });
});

