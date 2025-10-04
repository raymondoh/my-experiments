import { requireSession } from "@/lib/auth/require-session";
import { jobService } from "@/lib/services/job-service";
import { userService } from "@/lib/services/user-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { FileText, ArrowLeft, User } from "lucide-react";
import { formatDateShortGB } from "@/lib/utils";

export default async function CustomerQuotesPage() {
  // The layout guard handles the primary auth and role checks.
  // We use requireSession() to get the fresh session data.
  const session = await requireSession();

  const jobs = await jobService.getJobsByCustomer(session.user.id);

  const quotesByJob = await Promise.all(
    jobs.map(async job => {
      const quotes = await jobService.getQuotesByJobId(job.id);
      return quotes.map(quote => ({ ...quote, jobTitle: job.title }));
    })
  );

  const flatQuotes = quotesByJob.flat();
  const quotesWithNames = await Promise.all(
    flatQuotes.map(async quote => {
      const tradesperson = await userService.getUserById(quote.tradespersonId);
      return {
        ...quote,
        jobId: quote.jobId,
        tradespersonName: tradesperson?.businessName || tradesperson?.name || "Tradesperson"
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/customer">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Quotes Received</h1>
          <p className="text-muted-foreground">Review all quotes you have received for your job postings.</p>
        </div>
      </div>

      {quotesWithNames.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">You haven&apos;t received any quotes yet.</h3>
            <p className="text-muted-foreground">When a tradesperson sends you a quote, it will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Quotes ({quotesWithNames.length})</CardTitle>
            <CardDescription>List of quotes received for your jobs.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Tradesperson</TableHead>
                  <TableHead>Date Received</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotesWithNames.map(quote => (
                  <TableRow key={quote.id}>
                    <TableCell>{quote.jobTitle}</TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/customer/tradesperson/${quote.tradespersonId}`}
                        className="hover:underline flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {quote.tradespersonName}
                      </Link>
                    </TableCell>

                    {/* New Column Added Here */}
                    <TableCell>{formatDateShortGB(quote.createdAt)}</TableCell>

                    <TableCell>£{quote.price}</TableCell>
                    <TableCell className="max-w-md truncate">{quote.description}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/customer/jobs/${quote.jobId}/quotes`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
