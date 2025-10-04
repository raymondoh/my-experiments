// src/app/(marketing)/resources/customer-job-posting-checklist/page.tsx
import type { Metadata } from "next";
import { Container } from "@/components/marketing/container";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { PageHero } from "@/components/marketing/page-hero";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Customer Job Posting Checklist | Plumbers Portal",
  description: "Everything customers should include when posting a plumbing job to get fast, accurate quotes."
};

const checklist = [
  {
    name: "Describe the problem clearly",
    detail: "What happened, when it started, any prior fixes."
  },
  {
    name: "Location & access",
    detail: "Exact area of the property, parking, entry instructions."
  },
  {
    name: "Photos/videos",
    detail: "Close-ups + context shots; short video for noises/leaks."
  },
  {
    name: "Measurements & materials",
    detail: "Pipe sizes, fixtures, model numbers if known."
  },
  {
    name: "Timing",
    detail: "Ideal start date, acceptable windows, urgency level."
  },
  {
    name: "Constraints",
    detail: "Budget range, quiet hours, building rules, pets."
  }
];

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Customer Job Posting Checklist",
    description: "A step-by-step checklist to help customers post plumbing jobs and get accurate quotes.",
    supply: ["Photos", "Measurements"],
    step: checklist.map((item, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: item.name,
      itemListElement: {
        "@type": "HowToDirection",
        text: item.detail
      }
    }))
  };

  return (
    <>
      <MarketingHeader />
      <main className="py-16">
        <Container>
          <PageHero
            title="Customer Job Posting Checklist"
            subtitle="Include these details to help tradespeople quote accurately and quickly."
          />

          <ol className="grid gap-4 md:grid-cols-2">
            {checklist.map((c, i) => (
              <li key={c.name} className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="text-sm text-muted-foreground">Step {i + 1}</div>
                <h2 className="mt-1 text-lg font-semibold">{c.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{c.detail}</p>
              </li>
            ))}
          </ol>
        </Container>
        <JsonLd data={jsonLd} />
      </main>
    </>
  );
}
