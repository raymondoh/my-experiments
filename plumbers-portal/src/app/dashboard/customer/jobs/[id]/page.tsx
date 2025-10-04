// src/app/dashboard/customer/jobs/[id]/page.tsx
import { requireSession } from "@/lib/auth/require-session";
import { redirect, notFound } from "next/navigation";
import { jobService } from "@/lib/services/job-service";
import { userService } from "@/lib/services/user-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  PoundSterling,
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
  Edit,
  FileText,
  Star
} from "lucide-react";
import { getUrgencyColor, getUrgencyLabel, getStatusColor, getStatusLabel } from "@/lib/types/job";
import { formatDateTimeGB } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CancelJobButton } from "@/components/jobs/cancel-job-button";
import { PaymentSummary } from "@/components/jobs/payment-summary";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerJobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const session = await requireSession();

  const job = await jobService.getJobById(id);
  if (!job) {
    notFound();
  }

  const isOwner = job.customerId === session.user.id;
  const isAdmin = session.user.role === "admin";

  if (!isOwner && !isAdmin) {
    redirect("/dashboard");
  }

  const quotes = await jobService.getQuotesByJobId(job.id);
  const acceptedQuote = quotes.find(q => q.id === job.acceptedQuoteId);
  const tradesperson = job.tradespersonId ? await userService.getUserById(job.tradespersonId) : null;

  const canEdit = isOwner || isAdmin;
  const canCancel = isOwner && ["open", "quoted", "assigned"].includes(job.status);

  // --- THIS IS THE FIX ---
  // The PaymentSummary card should be shown as soon as a quote is accepted,
  // not only when the job is completed.
  const showPaymentSummary = !!acceptedQuote;
  // --- END OF FIX ---

  const showLeaveReviewButton =
    isOwner && job.status === "completed" && job.paymentStatus === "fully_paid" && !job.reviewId;

  const noQuotesReceived = quotes.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/customer/jobs" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to My Jobs
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-3xl">{job.title}</CardTitle>
                  <CardDescription className="mt-2 flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <p className="text-sm">Posted {formatDateTimeGB(job.createdAt)}</p>
                  </CardDescription>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Badge className={getUrgencyColor(job.urgency)}>{getUrgencyLabel(job.urgency)}</Badge>
                  <Badge className={getStatusColor(job.status)}>{getStatusLabel(job.status)}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.description}</p>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
                  <div>
                    <span className="font-semibold">Location</span>
                    <p className="text-muted-foreground">{job.location.address}</p>
                    <p className="text-muted-foreground">{job.location.postcode}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <PoundSterling className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
                  <div>
                    <span className="font-semibold">Budget</span>
                    <p className="text-muted-foreground">{job.budget ? `£${job.budget}` : "Not specified"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Use the corrected condition here */}
          {showPaymentSummary && acceptedQuote && <PaymentSummary job={job} quote={acceptedQuote} />}
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          {showLeaveReviewButton && (
            <Card className="border-primary bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Star className="h-5 w-5" />
                  Rate Your Experience
                </CardTitle>
                <CardDescription>
                  Your feedback is important. Please take a moment to leave a review for the tradesperson.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/customer/jobs/${job.id}/review`}>Leave a Review</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {tradesperson && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Assigned Tradesperson
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{tradesperson.name}</p>
                <p className="text-sm text-muted-foreground">{tradesperson.businessName}</p>
                <Button variant="secondary" size="sm" asChild className="mt-4 w-full">
                  <Link href={`/dashboard/messages/${job.id}`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Tradesperson
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quotes & Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link href={`/dashboard/customer/jobs/${job.id}/quotes`}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Quotes ({quotes.length})
                </Link>
              </Button>
              {canEdit && (
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/dashboard/customer/jobs/${job.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Job
                  </Link>
                </Button>
              )}
              {canCancel && <CancelJobButton jobId={job.id} />}
            </CardContent>
          </Card>

          {job.status === "open" && noQuotesReceived && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your job is live and has been sent to local tradespeople. You will be notified as soon as you receive
                your first quote.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
