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

export default function CertificationStatusUpdatedModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("certification_status_updated")) {
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
        <AlertDialogTitle className="sr-only">Status Updated</AlertDialogTitle>
        <AlertDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <AlertDialogDescription className="text-center pt-4 text-lg font-medium">
            Certification Status Updated
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="text-center text-sm text-muted-foreground py-2">
          The tradesperson has been notified of the change.
        </div>

        <AlertDialogFooter className="mt-4">
          <AlertDialogAction onClick={handleClose} className="w-full">
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
