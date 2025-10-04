"use client";

import { useEffect } from "react";
import { toast } from "sonner";

interface ReviewPromptProps {
  jobId: string;
  tradespersonId?: string;
}

export default function ReviewPrompt({ jobId, tradespersonId }: ReviewPromptProps) {
  useEffect(() => {
    if (tradespersonId) {
      toast.info("Job completed! Leave a review for your tradesperson.", {
        action: {
          label: "Review",
          onClick: () => {
            window.location.href = `/dashboard/customer/jobs/${jobId}/review`;
          }
        }
      });
    }
  }, [jobId, tradespersonId]);

  return null;
}
