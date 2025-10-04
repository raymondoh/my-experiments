// src/app/(marketing)/join-our-network/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { PageHero } from "@/components/marketing/page-hero"; // The newly renamed hero component
import { MarketingHeader } from "@/components/layout/marketing-header";

export const metadata: Metadata = {
  title: "Join Our Network | Plumbers Portal",
  description: "Grow your plumbing business with verified leads, simple quoting, and secure payments."
};

export default function Page() {
  const tiers = [
    {
      name: "Basic",
      price: "Free",
      blurb: "Great for getting started.",
      points: [
        "Up to 5 quotes/month (portal enforced)",
        "Verified profile & reviews",
        "Lead notifications in your area"
      ],
      footnote: "Quote cap enforced during submit; we’ll show an upgrade upsell when you hit the limit."
    },
    {
      name: "Pro",
      price: "£—/mo",
      blurb: "For growing traders who want more visibility.",
      points: ["Increased monthly quotes", "Featured placement in search", "Priority support"]
    },
    {
      name: "Business",
      price: "£—/mo",
      blurb: "For teams and established firms.",
      points: ["Highest monthly quote limits", "Top featured placement", "Team seats & analytics"]
    }
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Plumbers Portal Tradesperson Membership",
    description: "Lead access, verified profile, and secure payments.",
    offers: [
      { "@type": "Offer", name: "Basic", price: 0, priceCurrency: "GBP" },
      { "@type": "Offer", name: "Pro", price: "TBD", priceCurrency: "GBP" },
      {
        "@type": "Offer",
        name: "Business",
        price: "TBD",
        priceCurrency: "GBP"
      }
    ]
  };

  return (
    <>
      <MarketingHeader />
      <PageHero
        title="Join Our Network"
        subtitle="Verified leads, fair quoting, and fast payouts—without the admin headache."
        cta={[
          { href: "/register?role=tradesperson", label: "Create Your Account" },
          { href: "/pricing", label: "View Pricing & Limits" }
        ]}
      />

      <section className="grid gap-6 md:grid-cols-3">
        {tiers.map(t => (
          <div key={t.name} className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="text-sm text-muted-foreground">{t.name}</div>
            <div className="mt-1 text-2xl font-semibold">{t.price}</div>
            <p className="mt-2 text-sm">{t.blurb}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {t.points.map((p, i) => (
                <li key={i}>• {p}</li>
              ))}
            </ul>
            {t.footnote && <p className="mt-3 text-xs text-muted-foreground">{t.footnote}</p>}
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">What you’ll need to get verified</h2>
        <ul className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
          <li>• Company details & proof of address</li>
          <li>• Public liability insurance</li>
          <li>• Trade qualifications/certifications</li>
          <li>• Recent project photos</li>
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">How jobs and payments work</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You’ll receive relevant job leads, submit quotes in-app, and collect a deposit via our checkout. When the job
          is complete, capture the final payment. We use a Stripe-based marketplace flow to route funds securely.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link href="/register?role=tradesperson" className="rounded-xl border px-4 py-2 font-medium hover:bg-accent">
          Create Your Account
        </Link>
        <Link href="/pricing" className="rounded-xl border px-4 py-2 font-medium hover:bg-accent">
          View Pricing & Limits
        </Link>
      </div>

      <JsonLd data={jsonLd} />
    </>
  );
}
