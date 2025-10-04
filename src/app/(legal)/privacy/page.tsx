import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Privacy Policy | Plumbers Portal",
  description: "How we handle your personal data in compliance with UK GDPR and the Data Protection Act 2018."
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Privacy Policy | Plumbers Portal",
    dateModified: "2025-09-17",
    about: { "@type": "Organization", name: "Plumbers Portal" }
  };

  return (
    <>
      <main className="mx-auto max-w-3xl px-6 py-16 space-y-8 text-sm leading-relaxed">
        <article className="">
          <h1>Privacy Policy</h1>
          <p>
            <em>Last updated: 17 September 2025</em>
          </p>

          <p>
            Plumbers Portal (“we”, “us”) is committed to protecting your privacy. This policy explains how we collect,
            use, and share your personal information in accordance with UK GDPR and the Data Protection Act 2018.
          </p>

          <h2>Who we are</h2>
          <p>
            Controller: Plumbers Portal Ltd (replace with your legal entity and address). Contact:
            <Link href="/contact"> Contact form</Link> or support@example.com.
          </p>

          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Account data:</strong> name, email, password (hashed), phone, role.
            </li>
            <li>
              <strong>Profile & verification:</strong> business name, qualifications, insurance, IDs/certificates,
              profile photo.
            </li>
            <li>
              <strong>Job & quote data:</strong> descriptions, photos/videos, messages, quotes, availability, job
              addresses.
            </li>
            <li>
              <strong>Payments:</strong> processed by Stripe; we store Stripe IDs/metadata, not full card numbers.
            </li>
            <li>
              <strong>Technical:</strong> IP, device, cookies, usage logs for security and analytics.
            </li>
          </ul>

          <h2>How we use your data (lawful bases)</h2>
          <ul>
            <li>
              <strong>Provide the service</strong> (contract): accounts, jobs, quotes, payments, payouts.
            </li>
            <li>
              <strong>Verification & safety</strong> (legitimate interests/legal): checks, fraud prevention, security
              logging.
            </li>
            <li>
              <strong>Comms</strong> (contract/legitimate interests): service emails, job updates, receipts; marketing
              only with consent.
            </li>
            <li>
              <strong>Improve services</strong> (legitimate interests/consent): analytics, debugging, product
              development.
            </li>
          </ul>

          <h2>Sharing your data</h2>
          <ul>
            <li>
              <strong>With other users:</strong> job details and profile info as needed to deliver quotes/complete work.
            </li>
            <li>
              <strong>Processors:</strong> Stripe, Firebase/Google Cloud, email provider (e.g., Resend/Mailchimp), etc.,
              under DPAs.
            </li>
            <li>
              <strong>Legal/compliance:</strong> if required by law or to enforce terms, prevent fraud, or protect
              users.
            </li>
          </ul>

          <h2>International transfers</h2>
          <p>We rely on adequacy decisions or SCCs with additional safeguards where needed.</p>

          <h2>Data retention</h2>
          <p>
            We keep data only as long as necessary (e.g., account lifetime; transaction records per tax rules; logs per
            security timeframes). You can request deletion subject to legal obligations.
          </p>

          <h2>Your rights</h2>
          <ul>
            <li>Access, rectification, erasure, portability.</li>
            <li>Restriction or objection to certain processing.</li>
            <li>Withdraw consent at any time (where applicable).</li>
            <li>
              Complain to the ICO (
              <a href="https://ico.org.uk" target="_blank" rel="noreferrer">
                ico.org.uk
              </a>
              ).
            </li>
          </ul>

          <h2>Security</h2>
          <p>We use strong authentication, RBAC, encryption in transit, and verification checks for tradespeople.</p>

          <h2>Children</h2>
          <p>Not directed to children under 16.</p>

          <h2>Changes</h2>
          <p>We’ll update this policy as services evolve and post the updated date above.</p>

          <h2>Contact</h2>
          <p>
            Questions? Email support@example.com or use our <Link href="/contact">contact form</Link>.
          </p>
        </article>

        <JsonLd data={jsonLd} />
      </main>
    </>
  );
}
