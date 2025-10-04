import Link from "next/link";
import type { Job } from "@/lib/types/job";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUrgencyLabel } from "@/lib/types/job";
import { MapPin, PoundSterling } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobCardProps {
  job: Job;
  className?: string;
}

export function JobCard({ job, className }: JobCardProps) {
  // Get the first part of the postcode, or use the full string if there's no space
  const postcodeArea = job.location.postcode?.split(" ")[0] || job.location.postcode;

  return (
    <div className="h-full">
      <Link href={`/dashboard/tradesperson/job-board/${job.id}`}>
        <Card className={cn("hover:border-primary transition-colors h-full flex flex-col", className)}>
          <CardContent className="p-4 flex flex-col flex-grow">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{job.title}</h3>
            <div className="flex-grow" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {/* Display the postcode area instead of the full postcode */}
                <span>{job.location.town || postcodeArea}</span>
              </div>
              {job.budget && (
                <div className="flex items-center gap-2">
                  <span>Budget: £{job.budget}</span>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Badge>{getUrgencyLabel(job.urgency)}</Badge>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
