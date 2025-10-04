// src/app/(marketing)/resources/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { MarketingHeader } from "@/components/layout/marketing-header"; // The new breadcrumbs header
import { PageHero } from "@/components/marketing/page-hero"; // The new hero component
import { Container } from "@/components/marketing/container"; // Import the container

export const metadata: Metadata = {
  title: "Resources | Plumbers Portal",
  description: "Guides, checklists, and templates to help customers and tradespeople succeed."
};

type Resource = {
  title: string;
  href: string;
  kind: "Guide" | "Template" | "Checklist" | "Policy";
  blurb: string;
};

const resources: Resource[] = [
  {
    title: "Customer Job Posting Checklist",
    href: "/resources/customer-job-posting-checklist",
    kind: "Checklist",
    blurb: "Everything to include for clear quotes: photos, measurements, access, timing."
  },
  {
    title: "Tradesperson Quote Template",
    href: "/resources/quote-template",
    kind: "Template",
    blurb: "A clean, professional quote format with scope, exclusions, and payment terms."
  },
  {
    title: "Photo Guide: Before/After Shots",
    href: "/resources/photo-guide",
    kind: "Guide",
    blurb: "How to capture job photos that build trust and win more work."
  },
  {
    title: "Payments & Disputes Overview",
    href: "/resources/payments-and-disputes",
    kind: "Guide",
    blurb: "How deposits and final payments work, and what to do if something goes wrong."
  }
];

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Resources | Plumbers Portal",
    hasPart: resources.map(r => ({
      "@type": "CreativeWork",
      name: r.title,
      url: r.href
    }))
  };

  return (
    <>
      <MarketingHeader />

      {/* --- THIS IS THE FIX: The Container is now wrapping the page content --- */}
      <main className="py-16">
        <Container>
          <PageHero
            title="Resources"
            subtitle="Practical help for customers and tradespeople—free and always growing."
            cta={[{ href: "/contact", label: "Suggest a resource" }]}
          />

          <ul className="grid gap-4 md:grid-cols-2">
            {resources.map(r => (
              <li key={r.title} className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{r.kind}</div>
                <h2 className="mt-1 text-lg font-semibold">
                  <Link href={r.href} className="hover:underline">
                    {r.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{r.blurb}</p>
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-2xl border bg-card p-6">
            <h2 className="text-xl font-semibold">Looking for something specific?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tell us what you’d like to see next and we’ll add it to the roadmap.
            </p>
            <div className="mt-4">
              <Link href="/contact" className="rounded-xl border px-4 py-2 font-medium hover:bg-accent">
                Suggest a resource
              </Link>
            </div>
          </div>
        </Container>
      </main>
      {/* --- END OF FIX --- */}

      <JsonLd data={jsonLd} />
    </>
  );
}
