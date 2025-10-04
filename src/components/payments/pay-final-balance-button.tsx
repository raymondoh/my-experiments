"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PayFinalBalanceButtonProps {
  jobId: string;
  quoteId: string;
}

export default function PayFinalBalanceButton({ jobId, quoteId }: PayFinalBalanceButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe.js has not loaded yet.");
      }

      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          quoteId,
          paymentType: "final" // Specify this is the final payment
        })
      });

      const session = await res.json();

      if (!res.ok) {
        throw new Error(session.error || "Failed to create checkout session.");
      }

      if (session.sessionId) {
        const result = await stripe.redirectToCheckout({
          sessionId: session.sessionId
        });

        if (result.error) {
          toast.error("Payment failed", {
            description: result.error.message
          });
        }
      } else if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error("Could not retrieve checkout session details.");
      }
    } catch (err) {
      toast.error("Payment Error", {
        description: err instanceof Error ? err.message : "An unexpected error occurred."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handlePayment} disabled={loading} className="w-full">
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
      {loading ? "Processing..." : "Pay Final Balance"}
    </Button>
  );
}
