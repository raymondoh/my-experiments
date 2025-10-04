// src/components/jobs/save-job-button.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Tier = "basic" | "pro" | "business";

interface SaveJobButtonProps {
  jobId: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  allowRemove?: boolean;
  /** Optional server-provided tier that overrides the session tier for more accurate gating */
  tierOverride?: Tier;
  /** If true, render an upgrade CTA instead of hiding the control when not allowed */
  showUpsell?: boolean;
}

export function SaveJobButton({
  jobId,
  className,
  size = "default",
  allowRemove = false,
  tierOverride,
  showUpsell = false
}: SaveJobButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const sessionTier = (session?.user?.subscriptionTier ?? "basic") as Tier;
  const tier = tierOverride ?? sessionTier;
  const canSave = tier === "pro" || tier === "business";

  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check if job is already saved
  useEffect(() => {
    if (!canSave) {
      setIsInitializing(false);
      return;
    }
    async function checkSavedStatus() {
      try {
        const response = await fetch("/api/jobs/save");
        if (response.ok) {
          const data = await response.json();
          setIsSaved((data.savedJobs as string[]).includes(jobId));
        }
      } catch (error) {
        console.error("Error checking saved status:", error);
      } finally {
        setIsInitializing(false);
      }
    }
    checkSavedStatus();
  }, [jobId, canSave]);

  const toggleSaved = async () => {
    if (isSaved && !allowRemove) return;
    setIsLoading(true);
    try {
      const method = isSaved ? "DELETE" : "POST";
      const response = await fetch("/api/jobs/save", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to update saved status");
      }

      const wasSaved = isSaved;
      setIsSaved(!isSaved);
      toast.success(wasSaved ? "Job removed from saved jobs" : "Job saved successfully", {
        description: wasSaved
          ? "This job has been removed from your saved jobs."
          : "This job has been added to your saved jobs."
      });

      if (wasSaved && allowRemove) {
        router.refresh();
      }
    } catch (error) {
      toast.error("Error", {
        description: (error as Error).message || "Something went wrong. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const baseClasses = cn("bg-transparent", size === "default" && "w-full", className);

  if (!canSave) {
    return showUpsell ? (
      <Button variant="outline" size={size} className={baseClasses} asChild>
        <Link href="/pricing">
          <Bookmark className="mr-2 h-4 w-4" />
          Upgrade to save
        </Link>
      </Button>
    ) : null;
  }

  if (isInitializing) {
    return (
      <Button variant="outline" size={size} className={baseClasses} disabled>
        <Bookmark className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size={size}
      className={baseClasses}
      onClick={toggleSaved}
      disabled={isLoading || (isSaved && !allowRemove)}>
      {isSaved ? (
        allowRemove ? (
          <>
            <BookmarkCheck className="mr-2 h-4 w-4" />
            {isLoading ? "Removing..." : "Remove Job"}
          </>
        ) : (
          <>
            <BookmarkCheck className="mr-2 h-4 w-4" />
            Saved
          </>
        )
      ) : (
        <>
          <Bookmark className="mr-2 h-4 w-4" />
          {isLoading ? "Saving..." : "Save Job"}
        </>
      )}
    </Button>
  );
}
