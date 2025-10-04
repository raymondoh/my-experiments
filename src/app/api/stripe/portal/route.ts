// src/app/api/stripe/portal/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import { UsersCollection } from "@/lib/firebase/admin";
import { stripe } from "@/lib/stripe/server";

export async function POST() {
  try {
    const session = await requireSession();
    const uid = session.user.id!;
    const role = session.user.role;

    // Authorization: Only tradespeople have subscriptions to manage.
    if (role !== "tradesperson") {
      return NextResponse.json({ error: "Forbidden: Only tradespeople can manage subscriptions." }, { status: 403 });
    }

    const userSnap = await UsersCollection().doc(uid).get();
    const data = (userSnap.data() ?? {}) as { stripeCustomerId?: string };
    const customerId = data.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json({ error: "No Stripe customer on file" }, { status: 400 });
    }

    const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create a new URL object for the redirect destination
    const redirectUrl = new URL("/dashboard/tradesperson", domain);

    // Add the cancellation parameter to the new URL
    redirectUrl.searchParams.set("subscription_cancelled", "true");

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: redirectUrl.toString() // Use the updated URL here
    });

    const res = NextResponse.json({ url: portal.url });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("Create billing portal error", err);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
