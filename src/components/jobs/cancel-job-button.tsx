"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CancelJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const cancelJob = async () => {
    if (!confirm("Cancel this job?")) return;
    setLoading(true);
    await fetch(`/api/jobs/${jobId}/cancel`, { method: "POST" });
    setLoading(false);
    router.refresh();
  };

  return (
    <Button
      onClick={cancelJob}
      variant="destructive"
      className="w-full"
      disabled={loading}
    >
      Cancel Job
    </Button>
  );
}
