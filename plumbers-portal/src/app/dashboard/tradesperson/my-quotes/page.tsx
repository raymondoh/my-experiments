import { requireSession } from "@/lib/auth/require-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { FileText, Plus, CheckCircle } from "lucide-react"; // Import CheckCircle
import { jobService } from "@/lib/services/job-service";
import { formatDateShortGB } from "@/lib/utils";
import { Badge } from "@/components/ui/badge"; // Import Badge
import type { PaymentStatus } from "@/lib/types/job";

export default async function MyQuotesPage() {
  const session = await requireSession();
  const quotes = await jobService.getQuotesByTradespersonId(session.user.id);

  // --- THIS IS THE FIX (Part 1) ---
  // We now fetch the full job object for each quote to access its status and payment details.
  const quotesWithJobDetails = await Promise.all(
    quotes.map(async quote => {
      const job = await jobService.getJobById(quote.jobId);
      return { ...quote, job }; // Attach the full job object
    })
  );

  const depositPaidStatuses = new Set<PaymentStatus>([
    "deposit_paid",
    "pending_final",
    "fully_paid",
    "authorized",
    "captured",
    "succeeded"
  ]);
  // --- END OF FIX ---

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Submitted Quotes</h1>
          <p className="text-muted-foreground">Here are the quotes you have submitted for jobs.</p>
        </div>
      </div>

      {quotesWithJobDetails.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent className="space-y-4 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto" />
            <h3 className="text-lg font-semibold text-foreground">You haven't submitted any quotes yet.</h3>
            <p>Find jobs on the job board to submit your first quote.</p>
            <Button asChild className="mt-2">
              <Link href="/dashboard/tradesperson/job-board">
                <Plus className="mr-2 h-4 w-4" /> Find Jobs to Quote
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Quotes ({quotesWithJobDetails.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Price</TableHead>
                  {/* --- THIS IS THE FIX (Part 2) --- */}
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  {/* --- END OF FIX --- */}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotesWithJobDetails.map(({ job, ...quote }) => {
                  // --- THIS IS THE FIX (Part 3) ---
                  // Determine the status and payment status for each quote.
                  const isAccepted = job?.acceptedQuoteId === quote.id;
                  const hasDepositBeenPaid =
                    isAccepted && job?.paymentStatus ? depositPaidStatuses.has(job.paymentStatus) : false;

                  return (
                    <TableRow key={quote.id}>
                      <TableCell>{job?.title || "Job"}</TableCell>
                      <TableCell>{formatDateShortGB(quote.createdAt)}</TableCell>
                      <TableCell>£{quote.price}</TableCell>
                      <TableCell>
                        {isAccepted ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                            Accepted
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasDepositBeenPaid ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="mr-1.5 h-3 w-3" />
                            Deposit Paid
                          </Badge>
                        ) : isAccepted ? (
                          <Badge variant="outline">Awaiting</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      {/* --- END OF FIX --- */}
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/tradesperson/job-board/${quote.jobId}`}>View Job</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
