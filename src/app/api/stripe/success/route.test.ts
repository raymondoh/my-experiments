jest.mock("next/server", () => ({
  NextResponse: { redirect: jest.fn() }
}));

jest.mock("@/lib/stripe/server", () => ({
  stripe: { checkout: { sessions: { retrieve: jest.fn() } } }
}));

jest.mock("@/lib/auth/require-session", () => ({
  requireSession: jest.fn()
}));

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { requireSession } from "@/lib/auth/require-session";
import { GET } from "./route";

describe("stripe success route", () => {
  beforeEach(() => {
    (NextResponse.redirect as jest.Mock).mockReset();
    (stripe.checkout.sessions.retrieve as jest.Mock).mockReset();
    (requireSession as jest.Mock).mockReset();
  });

  it("sets upgrade cookie when tier allowed and user matches", async () => {
    const set = jest.fn();
    (NextResponse.redirect as jest.Mock).mockImplementation((url) => ({ url, cookies: { set } }));
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({ metadata: { tier: "pro", userId: "u1" } });

    const req: any = { url: "http://localhost/api/stripe/success?session_id=sess_1" };
    await GET(req);
    expect(set).toHaveBeenCalled();
    const value = set.mock.calls[0][1];
    expect(decodeURIComponent(value)).toBe(JSON.stringify({ tier: "pro" }));
    expect(set.mock.calls[0][2]).toMatchObject({ maxAge: 60, httpOnly: false });
  });

  it("skips cookie if session user doesn't match metadata", async () => {
    const set = jest.fn();
    (NextResponse.redirect as jest.Mock).mockImplementation((url) => ({ url, cookies: { set } }));
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({ metadata: { tier: "pro", userId: "u2" } });

    const req: any = { url: "http://localhost/api/stripe/success?session_id=sess_1" };
    await GET(req);
    expect(set).not.toHaveBeenCalled();
  });

  it("does not set cookie without session id", async () => {
    const set = jest.fn();
    (NextResponse.redirect as jest.Mock).mockImplementation((url) => ({ url, cookies: { set } }));

    const req: any = { url: "http://localhost/api/stripe/success" };
    await GET(req);
    expect(set).not.toHaveBeenCalled();
  });

  it("redirects to job details when checkout metadata contains jobId", async () => {
    const set = jest.fn();
    (NextResponse.redirect as jest.Mock).mockImplementation((url) => ({ url, cookies: { set } }));
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({ metadata: { jobId: "job_123" } });

    const req: any = { url: "http://localhost/api/stripe/success?session_id=sess_1" };
    await GET(req);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "http://localhost/dashboard/customer/jobs/job_123?deposit_paid=true"
      })
    );
    expect(requireSession).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });
});
