import { requireSession } from "@/lib/auth/require-session";
import { notFound } from "next/navigation";
import { jobService } from "@/lib/services/job-service";
import ReviewForm from "@/components/reviews/review-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;

  // The layout guard ensures the user is an authenticated customer or admin.
  // We get the fresh session to perform the ownership check.
  const session = await requireSession();

  const job = await jobService.getJobById(id);

  // This is a critical security check: ensure the logged-in user owns this job.
  if (!job || job.customerId !== session.user.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/customer/jobs/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Leave a Review</h1>
      </div>
      <ReviewForm jobId={id} tradespersonId={job.tradespersonId} />
    </div>
  );
}
