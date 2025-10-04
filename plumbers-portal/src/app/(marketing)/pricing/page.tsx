"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, UserPlus, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

import ManageSubscriptionButton from "@/components/subscriptions/manage-subscription-button";
import SubscriptionBadge from "@/components/subscriptions/subscription-badge";
import { MarketingHeader } from "@/components/layout/marketing-header";

type Tier = "basic" | "pro" | "business";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise: Promise<Stripe | null> = publishableKey ? loadStripe(publishableKey) : Promise.resolve(null);
const isStripeConfigured = Boolean(publishableKey);

const pricingTiers: Array<{
  id: Tier;
  name: string;
  price: { monthly: number; yearly: number };
  description: string;
  features: { customer: string[]; tradesperson: string[] };
  isMostPopular: boolean;
}> = [
  {
    id: "basic",
    name: "Basic",
    price: { monthly: 0, yearly: 0 },
    description: "Get started on the platform, whether you're hiring or working.",
    features: {
      customer: ["Post jobs for free", "Receive quotes from professionals", "Secure messaging system"],
      tradesperson: [
        "View and search the job board",
        "Submit up to 5 quotes per month",
        "Create a basic profile",
        "Receive standard job alerts"
      ]
    },
    isMostPopular: false
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 25, yearly: 250 },
    description: "For professionals looking to grow their business.",
    features: {
      customer: [],
      tradesperson: [
        "Everything in Basic, plus:",
        "Submit unlimited quotes",
        "Enhanced profile with photo gallery",
        "Display customer reviews and ratings",
        "Advanced job search filters",
        "Save jobs for later"
      ]
    },
    isMostPopular: true
  },
  {
    id: "business",
    name: "Business",
    price: { monthly: 49, yearly: 490 },
    description: "For established businesses that want maximum visibility.",
    features: {
      customer: [],
      tradesperson: [
        "Everything in Pro, plus:",
        "Featured profile in search results",
        "Access to an analytics dashboard",
        "Early access to new job postings",
        "See who has favorited your profile",
        "Priority support"
      ]
    },
    isMostPopular: false
  }
];

export default function PricingPage() {
  const sessionResult = useSession();
  const session = sessionResult?.data || null;
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState<Tier | null>(null);

  const currentTier: Tier = (session?.user?.subscriptionTier as Tier) || "basic";
  const isTradesperson = session?.user?.role === "tradesperson";

  const formatPrice = (price: number) =>
    price.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSubscribe = async (tierId: Tier) => {
    try {
      setIsLoading(tierId);

      if (!session?.user) {
        const role = tierId === "basic" ? "customer" : "tradesperson";
        router.push(`/register?role=${role}&callbackUrl=/pricing`);
        return;
      }

      if (tierId === "basic") {
        setIsLoading(null);
        return;
      }

      if (!isTradesperson) {
        router.push("/dashboard");
        setIsLoading(null);
        return;
      }

      if (!isStripeConfigured) {
        toast.error("Stripe is not configured", {
          description: "Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable plan upgrades."
        });
        setIsLoading(null);
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) {
        toast.error("Stripe is unavailable", {
          description: "We couldn't load Stripe at the moment. Please try again shortly."
        });
        setIsLoading(null);
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId, isYearly })
      });

      if (!res.ok) {
        console.error("Failed to create Stripe checkout session");
        setIsLoading(null);
        return;
      }

      const data = (await res.json()) as { sessionId?: string };
      if (data.sessionId) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      }
    } catch (err) {
      console.error("Subscribe error:", err);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <>
      <MarketingHeader />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 pt-32 pb-16">
          {!isStripeConfigured && (
            <Alert variant="destructive" className="mb-8">
              <AlertTitle>Stripe configuration required</AlertTitle>
              <AlertDescription>
                Add <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to your environment variables to enable paid plan
                upgrades.
              </AlertDescription>
            </Alert>
          )}

          {session?.user && (
            <div className="mb-6 flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Your current plan:</span>
              <SubscriptionBadge tier={currentTier} />
            </div>
          )}

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Choose the Plan That's Right for You
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Free for customers, with powerful options for tradespeople to grow their business.
            </p>
          </div>

          <div className="flex items-center justify-center space-x-4 mb-10">
            <span className={cn("font-medium", !isYearly ? "text-primary" : "text-muted-foreground")}>Monthly</span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} aria-label="Toggle billing frequency" />
            <span className={cn("font-medium", isYearly ? "text-primary" : "text-muted-foreground")}>
              Yearly <span className="text-primary font-semibold">(Save over 16%)</span>
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {pricingTiers.map(tier => {
              const isCurrentTier = currentTier === tier.id;
              const showManage = isCurrentTier && tier.id !== "basic" && isTradesperson;

              return (
                <Card
                  key={tier.id}
                  className={cn(
                    "flex flex-col h-full transition-all duration-300",
                    tier.isMostPopular ? "border-primary shadow-lg scale-105" : "border-border"
                  )}>
                  {tier.isMostPopular && (
                    <div className="bg-primary text-primary-foreground text-center py-3 px-4  text-sm font-semibold rounded-lg -mt-px mx-6">
                      Most Popular
                    </div>
                  )}

                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                      {tier.name}
                      {/* {isCurrentTier && <SubscriptionBadge tier={tier.id} />} */}
                    </CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-grow">
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold">
                        £{isYearly ? formatPrice(tier.price.yearly / 12) : formatPrice(tier.price.monthly)}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                      {isYearly && tier.price.yearly > 0 && (
                        <p className="text-sm text-muted-foreground">billed as £{tier.price.yearly} per year</p>
                      )}
                    </div>

                    {tier.features.customer.length > 0 && (
                      <div className="mb-4">
                        <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
                          <Users className="h-4 w-4 text-muted-foreground" /> For Customers
                        </h4>
                        <ul className="space-y-3">
                          {tier.features.customer.map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {tier.id === "basic" &&
                      tier.features.customer.length > 0 &&
                      tier.features.tradesperson.length > 0 && <Separator className="my-4" />}

                    {tier.features.tradesperson.length > 0 && (
                      <div>
                        <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" /> For Tradespeople
                        </h4>
                        <ul className="space-y-3">
                          {tier.features.tradesperson.map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter>
                    {showManage ? (
                      <ManageSubscriptionButton className="w-full" />
                    ) : (
                      <Button
                        className="w-full"
                        variant={tier.isMostPopular ? "default" : "outline"}
                        size="lg"
                        onClick={() => handleSubscribe(tier.id)}
                        disabled={
                          (tier.id !== "basic" && !isStripeConfigured) ||
                          (isLoading !== null && isLoading !== tier.id)
                        }>
                        {isLoading === tier.id ? (
                          "Processing..."
                        ) : !session?.user ? (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            {tier.id === "basic" ? "Sign Up for Free" : "Sign Up to Choose"}
                          </>
                        ) : isTradesperson && isCurrentTier ? (
                          "Your Current Plan"
                        ) : (
                          `Choose ${tier.name}`
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
