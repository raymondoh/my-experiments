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
  stripe: { paymentIntents: { create: jest.fn() } }
}));

jest.mock("@/lib/auth/require-session", () => ({ requireSession: jest.fn() }));

import { stripe } from "@/lib/stripe/server";
import { requireSession } from "@/lib/auth/require-session";
import { POST } from "./route";

describe("payments route", () => {
  beforeEach(() => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "user1" } });
    (stripe.paymentIntents.create as jest.Mock).mockReset();
  });

  it("creates a payment intent", async () => {
    (stripe.paymentIntents.create as jest.Mock).mockResolvedValue({ client_secret: "test_secret" });
    const req: any = { json: async () => ({ amount: 1000, currency: "usd" }) };
    const res = await POST(req);
    expect(requireSession).toHaveBeenCalled();
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith({ amount: 1000, currency: "usd" });
    expect(await res.json()).toEqual({ clientSecret: "test_secret" });
  });

  it("returns 400 for invalid input", async () => {
    const req: any = { json: async () => ({ amount: -1, currency: "usd" }) };
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("handles stripe errors", async () => {
    (stripe.paymentIntents.create as jest.Mock).mockRejectedValue(new Error("fail"));
    const req: any = { json: async () => ({ amount: 1000, currency: "usd" }) };
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to create payment intent" });
  });
});
