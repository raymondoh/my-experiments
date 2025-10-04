// src/app/dashboard/tradesperson/job-board/page.tsx
import { requireSession } from "@/lib/auth/require-session";
// FIX: Import the original, feature-rich component
import { JobsPageComponent } from "@/components/dashboard/jobs-page-component";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";

export default async function TradespersonJobsBoardPage() {
  const session = await requireSession();
  const effectiveTier = session.user.subscriptionTier ?? "basic";

  return (
    <>
      {/* Upsell banner for basic tier */}
      {effectiveTier === "basic" && (
        <div className="mb-4">
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle className="font-semibold">Unlock more on Pro & Business</AlertTitle>
            <AlertDescription>
              Get advanced job filters, save jobs for later, and submit unlimited quotes.
              <Button asChild size="sm" className="ml-2 inline-flex">
                <Link href="/pricing">See plans</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* FIX: Use the correct component with all its original props */}
      <JobsPageComponent
        session={session}
        pageTitle="Job Board"
        pageDescription="Find and quote on available jobs in your area."
        allowedRoles={["tradesperson", "admin"]}
        apiEndpoint="/api/jobs/search"
        isTradespersonView
      />
    </>
  );
}
