// // src/app/dashboard/customer/jobs/page.tsx
// import { requireSession } from "@/lib/auth/require-session";
// import { jobService } from "@/lib/services/job-service";
// import { getStatusColor, getStatusLabel } from "@/lib/types/job";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import Link from "next/link";
// import { Briefcase, Plus } from "lucide-react";
// import { formatDateGB } from "@/lib/utils";

// export default async function CustomerJobsPage() {
//   const session = await requireSession();

//   // FIX: Corrected the function name to match your job service
//   const jobs = await jobService.getJobsByCustomer(session.user.id);

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold">My Posted Jobs</h1>
//           <p className="text-muted-foreground">Track the status and quotes for all the jobs you've posted.</p>
//         </div>
//         <Link href="/dashboard/customer/jobs/create">
//           <Button className="w-full sm:w-auto">
//             <Plus className="mr-2 h-4 w-4" />
//             Post a New Job
//           </Button>
//         </Link>
//       </div>

//       {jobs.length === 0 ? (
//         <Card className="text-center py-16">
//           <CardContent className="space-y-6">
//             <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
//               <Briefcase className="h-8 w-8 text-muted-foreground" />
//             </div>
//             <div className="space-y-2">
//               <h3 className="text-xl font-semibold">You haven't posted any jobs yet.</h3>
//               <p className="text-muted-foreground">
//                 This is where you'll manage the jobs you post and review quotes from professionals.
//               </p>
//             </div>
//             <Button asChild size="lg" className="mt-2">
//               <Link href="/dashboard/customer/jobs/create">
//                 <Plus className="mr-2 h-4 w-4" /> Post a New Job
//               </Link>
//             </Button>
//           </CardContent>
//         </Card>
//       ) : (
//         <Card>
//           <CardHeader>
//             <CardTitle>Jobs Overview</CardTitle>
//             <CardDescription>Review the latest activity and manage responses in one place.</CardDescription>
//           </CardHeader>
//           <CardContent className="p-0">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead className="min-w-[200px]">Job Title</TableHead>
//                   <TableHead>Status</TableHead>
//                   <TableHead>Quotes</TableHead>
//                   <TableHead>Date Posted</TableHead>
//                   <TableHead className="text-right">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {jobs.map(job => {
//                   // FIX: Changed job.quotes?.length to job.quoteCount to match the available data
//                   const quotesReceived = job.quoteCount ?? 0;
//                   let actionLabel = "View Job";
//                   let actionHref = `/dashboard/customer/jobs/${job.id}`;

//                   if (job.status === "open") {
//                     actionLabel = "View Quotes";
//                     actionHref = `/dashboard/customer/jobs/${job.id}/quotes`;
//                   } else if (job.status === "in_progress") {
//                     actionLabel = "View Job";
//                     actionHref = `/dashboard/customer/jobs/${job.id}`;
//                   } else if (job.status === "completed") {
//                     actionLabel = "Leave a Review";
//                     actionHref = `/dashboard/customer/jobs/${job.id}/review`;
//                   }

//                   return (
//                     <TableRow key={job.id}>
//                       <TableCell className="font-medium">{job.title}</TableCell>
//                       <TableCell>
//                         <Badge className={getStatusColor(job.status)}>{getStatusLabel(job.status)}</Badge>
//                       </TableCell>
//                       <TableCell>{quotesReceived} Received</TableCell>
//                       <TableCell>{formatDateGB(job.createdAt)}</TableCell>
//                       <TableCell className="text-right">
//                         <Button asChild size="sm">
//                           <Link href={actionHref}>{actionLabel}</Link>
//                         </Button>
//                       </TableCell>
//                     </TableRow>
//                   );
//                 })}
//               </TableBody>
//             </Table>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }
import { requireSession } from "@/lib/auth/require-session";
import { jobService } from "@/lib/services/job-service";
import { getStatusColor, getStatusLabel } from "@/lib/types/job";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Briefcase, Plus, MoreHorizontal, Eye, Edit, Gavel, MessageSquare, Star } from "lucide-react";
import { formatDateGB } from "@/lib/utils";

export default async function CustomerJobsPage() {
  const session = await requireSession();
  const jobs = await jobService.getJobsByCustomer(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Posted Jobs</h1>
          <p className="text-muted-foreground">Track the status and quotes for all the jobs you've posted.</p>
        </div>
        <Link href="/dashboard/customer/jobs/create">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Post a New Job
          </Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent className="space-y-6">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">You haven't posted any jobs yet.</h3>
              <p className="text-muted-foreground">
                This is where you'll manage the jobs you post and review quotes from professionals.
              </p>
            </div>
            <Button asChild size="lg" className="mt-2">
              <Link href="/dashboard/customer/jobs/create">
                <Plus className="mr-2 h-4 w-4" /> Post a New Job
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Jobs Overview</CardTitle>
            <CardDescription>Review the latest activity and manage responses in one place.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Job Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quotes</TableHead>
                  <TableHead>Date Posted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map(job => {
                  const quotesReceived = job.quoteCount ?? 0;
                  return (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(job.status)}>{getStatusLabel(job.status)}</Badge>
                      </TableCell>
                      <TableCell>{quotesReceived} Received</TableCell>
                      <TableCell>{formatDateGB(job.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/customer/jobs/${job.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View Job Details</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/customer/jobs/${job.id}/quotes`}>
                                <Gavel className="mr-2 h-4 w-4" />
                                <span>View Quotes</span>
                              </Link>
                            </DropdownMenuItem>

                            {job.status === "open" && (
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/customer/jobs/${job.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit Job</span>
                                </Link>
                              </DropdownMenuItem>
                            )}

                            {job.status === "in_progress" && (
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/messages/${job.id}`}>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  <span>Message Tradesperson</span>
                                </Link>
                              </DropdownMenuItem>
                            )}

                            {job.status === "completed" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/customer/jobs/${job.id}/review`}>
                                    <Star className="mr-2 h-4 w-4" />
                                    <span>Leave a Review</span>
                                  </Link>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
