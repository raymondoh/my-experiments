import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe/server";
import { requireSession } from "@/lib/auth/require-session";

const paymentSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().length(3)
});

export async function POST(req: NextRequest) {
  try {
    // Authentication: Ensure the user is logged in before creating a payment intent.
    await requireSession();

    const body = await req.json();
    const { amount, currency } = paymentSchema.parse(body);

    const intent = await stripe.paymentIntents.create({ amount, currency });
    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
  }
}
