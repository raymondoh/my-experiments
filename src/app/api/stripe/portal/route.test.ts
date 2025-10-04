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
  stripe: { billingPortal: { sessions: { create: jest.fn() } } }
}));

jest.mock("@/lib/auth/require-session", () => ({ requireSession: jest.fn() }));
jest.mock("@/lib/firebase/admin", () => ({ UsersCollection: jest.fn() }));

import { stripe } from "@/lib/stripe/server";
import { requireSession } from "@/lib/auth/require-session";
import { UsersCollection } from "@/lib/firebase/admin";
import { POST } from "./route";

describe("stripe portal route", () => {
  beforeEach(() => {
    (requireSession as jest.Mock).mockReset();
    (stripe.billingPortal.sessions.create as jest.Mock).mockReset();
    (UsersCollection as jest.Mock).mockReset();
  });

  it("rejects non-tradesperson users", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "u1", role: "customer" } });
    const res = await POST();
    expect(res.status).toBe(403);
    expect(stripe.billingPortal.sessions.create).not.toHaveBeenCalled();
  });

  it("returns 400 when customer id missing", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "u1", role: "tradesperson" } });
    const get = jest.fn().mockResolvedValue({ data: () => ({}) });
    (UsersCollection as jest.Mock).mockReturnValue({ doc: () => ({ get }) });
    const res = await POST();
    expect(res.status).toBe(400);
    expect(stripe.billingPortal.sessions.create).not.toHaveBeenCalled();
  });
});
