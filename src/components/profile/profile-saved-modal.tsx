// src/components/profile/profile-saved-modal.tsx

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
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { CheckCircle2 } from "lucide-react";

export default function ProfileSavedModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("profile_saved")) {
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);
    const newPath = window.location.pathname;
    router.replace(newPath, { scroll: false });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogTitle className="sr-only">Profile Saved</AlertDialogTitle>
        <AlertDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/ ৫০">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <AlertDialogDescription className="text-center pt-4 text-lg font-medium text-foreground">
            Your profile has been updated!
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="text-center text-sm text-muted-foreground py-2">
          Your changes are now live and visible to potential customers.
        </div>

        <AlertDialogFooter className="mt-4">
          <AlertDialogAction onClick={handleClose} className="w-full">
            Back to Profile
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
