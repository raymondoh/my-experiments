import { jobService } from "@/lib/services/job-service";
import { SavedJobsCollection } from "@/lib/firebase/admin";
import { config } from "@/lib/config/app-mode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Eye, Bookmark, Crown } from "lucide-react";
import Link from "next/link";
import { getUrgencyColor, getUrgencyLabel, getStatusColor, getStatusLabel } from "@/lib/types/job";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { requireSession } from "@/lib/auth/require-session";

declare global {
  var mockSavedJobs: Map<string, Set<string>> | undefined;
}

export default async function SavedJobsPage() {
  // The layout guard handles role protection.
  // We use requireSession() to securely get the user's ID and fresh tier info.
  const session = await requireSession();

  const tier = (session.user.subscriptionTier ?? "basic") as "basic" | "pro" | "business";
  const isEligible = tier === "pro" || tier === "business";

  // 🔒 Soft-guard: Basic users see an upsell (no DB calls). This is a feature gate, not a security guard.
  if (!isEligible) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Saved Jobs</h1>
          <p className="text-muted-foreground">Jobs you’ve bookmarked to review later.</p>
        </div>

        <Card className="border-amber-300/50 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <Crown className="h-5 w-5" />
              Upgrade to save jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-amber-900/80 dark:text-amber-200/90">
            <p className="text-sm">
              Saving jobs is a <span className="font-semibold">Pro</span> and{" "}
              <span className="font-semibold">Business</span> feature.
            </p>
            <ul className="list-disc ml-5 text-sm space-y-1">
              <li>Bookmark promising jobs to revisit later</li>
              <li>Build a pipeline before you quote</li>
              <li>Combine with filters like “No quotes yet”</li>
            </ul>
            <div className="flex gap-2 pt-2">
              <Button asChild>
                <Link href="/pricing">See plans</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/tradesperson/job-board">Back to Job Board</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Eligible tiers: fetch saved jobs
  const tradespersonId = session.user.id;
  let savedJobIds: string[] = [];

  if (config.isMockMode) {
    if (global.mockSavedJobs?.has(tradespersonId)) {
      savedJobIds = Array.from(global.mockSavedJobs.get(tradespersonId)!);
    }
  } else {
    const snapshot = await SavedJobsCollection().where("tradespersonId", "==", tradespersonId).get();
    type SavedJobDoc = { jobId: string };
    savedJobIds = snapshot.docs.map(doc => (doc.data() as SavedJobDoc).jobId);
  }

  const jobs = (await Promise.all(savedJobIds.map(id => jobService.getJobById(id)))).filter(
    (j): j is NonNullable<typeof j> => Boolean(j)
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Saved Jobs</h1>
          <p className="text-muted-foreground">Jobs you have saved to review later.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/tradesperson/job-board">Browse Jobs</Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Bookmark className="h-10 w-10" />
              <p>You haven’t saved any jobs yet.</p>
              <Button className="mt-2" asChild>
                <Link href="/dashboard/tradesperson/job-board">Find jobs to save</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {jobs.map(job => (
            <Card key={job.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Badge className={getUrgencyColor(job.urgency)}>{getUrgencyLabel(job.urgency)}</Badge>
                  <Badge className={getStatusColor(job.status)}>{getStatusLabel(job.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-between border-t pt-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1.5" />
                  <span>{job.location.postcode}</span>
                </div>
                <div className="flex gap-2">
                  {/* allowRemove so the button switches to “Remove” and refreshes the list */}
                  <SaveJobButton jobId={job.id} size="sm" allowRemove />
                  <Link href={`/dashboard/tradesperson/job-board/${job.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
