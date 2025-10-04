// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { requireSession } from "@/lib/auth/require-session";
import { z } from "zod";

const bodySchema = z.object({
  tier: z.enum(["pro", "business"]),
  isYearly: z.boolean().optional()
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication: Ensure the user is logged in.
    const session = await requireSession();

    // 2. Authorization: Ensure only tradespeople can subscribe to plans.
    if (session.user.role !== "tradesperson") {
      return NextResponse.json({ error: "Only tradespeople can subscribe to plans." }, { status: 403 });
    }

    const parse = bodySchema.safeParse(await req.json());
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid request body", issues: parse.error.issues }, { status: 400 });
    }
    const { tier, isYearly } = parse.data;

    const priceMap: Record<string, { monthly?: string; yearly?: string }> = {
      pro: {
        monthly: process.env.STRIPE_PRO_PRICE_ID,
        yearly: process.env.STRIPE_PRO_PRICE_ID_YEARLY
      },
      business: {
        monthly: process.env.STRIPE_BUSINESS_PRICE_ID,
        yearly: process.env.STRIPE_BUSINESS_PRICE_ID_YEARLY
      }
    };

    const billingInterval = isYearly ? "yearly" : "monthly";
    const priceId = priceMap[tier]?.[billingInterval];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid tier or billing interval" }, { status: 400 });
    }

    // Use the *actual* origin of this request to avoid host/cookie mismatches.
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    console.log("✅ Generating Stripe session with success_url:", origin);
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      client_reference_id: session.user.id,
      metadata: {
        tier,
        billingInterval,
        userId: session.user.id
      }
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (err) {
    console.error("Stripe checkout error", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
