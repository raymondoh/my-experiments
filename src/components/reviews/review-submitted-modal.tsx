// src/components/reviews/review-submitted-modal.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";
import { CheckCircle2, Star } from "lucide-react";

export default function ReviewSubmittedModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const googleReviewUrl = searchParams.get("google_review_url");

  useEffect(() => {
    if (searchParams.get("review_submitted")) {
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);
    const newPath = window.location.pathname;
    router.replace(newPath, { scroll: false });
  };

  const handleShare = () => {
    if (googleReviewUrl) {
      window.open(googleReviewUrl, "_blank");
    }
    handleClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <AlertDialogTitle className="text-center pt-4 text-lg font-medium text-foreground">
            Thank you for your feedback!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm text-muted-foreground py-2">
            Your review helps other customers. Would you also be willing to share your review on Google to help this
            tradesperson grow their business?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 sm:justify-center">
          <AlertDialogCancel onClick={handleClose}>Maybe Later</AlertDialogCancel>
          {googleReviewUrl && (
            <AlertDialogAction onClick={handleShare} className="bg-blue-600 hover:bg-blue-700">
              <Star className="mr-2 h-4 w-4" />
              Share on Google
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
