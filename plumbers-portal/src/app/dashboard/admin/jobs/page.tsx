// src/app/dashboard/admin/jobs/page.tsx

import { jobService } from "@/lib/services/job-service";
import JobsPageClient from "@/components/dashboard/jobs-page-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminJobsPage() {
  // Fetch all jobs on the server
  const jobs = await jobService.getAllJobs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Jobs</h1>
        <p className="text-muted-foreground">View, filter, and manage all jobs posted on the platform.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Jobs ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/*
            The JobsPageClient component now handles the entire table,
            including the state for the delete dialog, fixing the error.
          */}
          <JobsPageClient jobs={jobs} isAdmin={true} />
        </CardContent>
      </Card>
    </div>
  );
}
