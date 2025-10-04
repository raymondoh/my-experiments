// src/app/api/stripe/success/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { requireSession } from "@/lib/auth/require-session";

function buildSubscriptionRedirect(req: NextRequest) {
  const redirectUrl = new URL("/dashboard/tradesperson", req.url);
  redirectUrl.searchParams.set("payment_success", "true");
  return NextResponse.redirect(redirectUrl);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return buildSubscriptionRedirect(req);
  }

  try {
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);
    const metadata = checkout.metadata ?? {};

    if (metadata.jobId) {
      const jobUrl = new URL(`/dashboard/customer/jobs/${metadata.jobId}`, req.url);
      jobUrl.searchParams.set("deposit_paid", "true");
      return NextResponse.redirect(jobUrl);
    }

    // Ensure the caller is authenticated and get the user session
    const session = await requireSession();

    const tier = metadata.tier;
    const metadataUserId = metadata.userId;
    const allowed = tier === "pro" || tier === "business";

    const redirectTo = buildSubscriptionRedirect(req);

    // 👇 Debug line to verify the route ran
    console.log("[stripe/success] session:", sessionId, "tier:", tier);
    // Short-lived, readable cookie for the toast, but only if the session
    // matches the authenticated user to prevent spoofing
    if (metadataUserId && session.user.id === metadataUserId) {
      redirectTo.cookies.set("upgrade_flash", encodeURIComponent(JSON.stringify({ tier: allowed ? tier : null })), {
        path: "/",
        maxAge: 60, // seconds
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: false // client can read to trigger toast
      });
    }

    return redirectTo;
  } catch {
    // If anything fails, just go to the dashboard
    return buildSubscriptionRedirect(req);
  }
}
