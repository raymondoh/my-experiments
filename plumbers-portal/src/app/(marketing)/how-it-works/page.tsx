// src/app/(marketing)/how-it-works/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { PageHero } from "@/components/marketing/page-hero"; // The newly renamed hero component

export const metadata: Metadata = {
  title: "How It Works | Plumbers Portal",
  description: "See how customers post jobs, tradespeople quote, and payments flow safely through our portal."
};

export default function Page() {
  const steps = [
    {
      title: "Post your job (free)",
      body: "Describe the work, add photos/videos, and pick a timeframe. We notify relevant tradespeople nearby."
    },
    {
      title: "Get quotes fast",
      body: "Pros review your job and send quotes with price, availability, and reviews."
    },
    {
      title: "Pick your pro",
      body: "Compare options, chat to confirm details, then book."
    },
    {
      title: "Secure payments",
      body: "Pay a deposit via checkout and the final on completion—funds handled securely."
    },
    {
      title: "Aftercare & reviews",
      body: "Rate your experience and keep records in your account."
    }
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How Plumbers Portal Works",
    description: "From posting a job to paying a verified tradesperson.",
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title
    }))
  };

  return (
    <>
      <MarketingHeader />
      <PageHero
        title="How It Works"
        subtitle="A clear path from posting a job to paying a verified tradesperson—built for speed, safety, and transparency."
        cta={[
          { href: "/dashboard/customer/jobs/create", label: "Post a Job" },
          { href: "/join-our-network", label: "Join as a Tradesperson" }
        ]}
      />

      <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <li key={i} className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="mb-2 text-sm font-medium text-muted-foreground">Step {i + 1}</div>
            <h3 className="text-xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-14 rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Why choose Plumbers Portal?</h2>
        <ul className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
          <li>• Verified tradespeople with profile checks</li>
          <li>• Clear quotes and timelines—no surprises</li>
          <li>• Secure, trackable payments (deposit & final)</li>
          <li>• Messaging, attachments, and audit trail</li>
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link
          href="/dashboard/customer/jobs/create"
          className="rounded-xl border px-4 py-2 font-medium hover:bg-accent">
          Post a Job
        </Link>
        <Link href="/join-our-network" className="rounded-xl border px-4 py-2 font-medium hover:bg-accent">
          Join as a Tradesperson
        </Link>
      </div>

      <JsonLd data={jsonLd} />
    </>
  );
}
