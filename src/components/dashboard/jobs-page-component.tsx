// src/components/dashboard/jobs-page-component.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, AlertCircle, Eye, MapPin, Search, RotateCcw } from "lucide-react";
import { JobFilters } from "@/components/jobs/job-filters";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import type { Job } from "@/lib/types/job";
import { getUrgencyColor, getUrgencyLabel } from "@/lib/types/job";
import { formatDateGB } from "@/lib/utils";
import type { Session } from "next-auth";
import { Input } from "@/components/ui/input";

interface JobsPageComponentProps {
  session: Session | null;
  pageTitle: string;
  pageDescription: string;
  allowedRoles: string[];
  apiEndpoint: string;
  isTradespersonView?: boolean;
}

export function JobsPageComponent({
  session,
  pageTitle,
  pageDescription,
  allowedRoles,
  apiEndpoint,
  isTradespersonView = false
}: JobsPageComponentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: clientSession, status: sessionStatus } = useSession();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");

  const effectiveTier = clientSession?.user?.subscriptionTier ?? "basic";

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session || !allowedRoles.includes(session.user.role)) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams(searchParams.toString());
        params.set("q", searchTerm);
        const url = `${apiEndpoint}?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch jobs.");
        }
        const data = await response.json();
        setJobs(data.jobs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session, sessionStatus, allowedRoles, apiEndpoint, searchParams, router, searchTerm]);

  const handleFilterChange = (newFilters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    params.set("page", "1");
    router.replace(`/dashboard/tradesperson/job-board?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    params.set("q", searchTerm);
    params.set("page", "1");
    router.replace(`/dashboard/tradesperson/job-board?${params.toString()}`);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h3 className="mt-4 text-lg font-medium">Something went wrong</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            <RotateCcw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </div>
      );
    }

    if (jobs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-12">
          <Briefcase className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No jobs found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            There are currently no jobs matching your criteria. Try adjusting your filters.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map(job => (
          <Card key={job.id} className="flex flex-col hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{job.title}</CardTitle>
                  <CardDescription>Posted {formatDateGB(job.createdAt)}</CardDescription>
                </div>
                <Badge className={getUrgencyColor(job.urgency)}>{getUrgencyLabel(job.urgency)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location.postcode}</span>
                </div>
                <p className="line-clamp-3 text-foreground">{job.description}</p>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                {/* --- THIS IS THE FIX --- */}
                {isTradespersonView && <SaveJobButton jobId={job.id} tierOverride={effectiveTier} />}
                {/* --- END OF FIX --- */}
                <Button asChild>
                  <Link href={`/dashboard/tradesperson/job-board/${job.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> View Job
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <Input
          type="search"
          placeholder="Search by keyword (e.g., 'boiler', 'leak')..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Button type="submit">
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </form>

      {isTradespersonView && <JobFilters onFilterChange={handleFilterChange} />}

      {renderContent()}
    </div>
  );
}
