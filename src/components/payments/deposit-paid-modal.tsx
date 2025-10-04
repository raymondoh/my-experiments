"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function DepositPaidModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("deposit_paid")) {
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("deposit_paid");
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogTitle className="sr-only">Deposit Paid Successfully</AlertDialogTitle>
        <AlertDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <AlertDialogDescription className="pt-4 text-center text-lg font-medium text-foreground">
            Deposit Paid Successfully!
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-2 text-center text-sm text-muted-foreground">
          Your deposit has been processed. We have notified the tradesperson, and the job is now secured. You can view the
          job details and chat with the tradesperson in your dashboard.
        </div>

        <AlertDialogFooter className="mt-4">
          <AlertDialogAction onClick={handleClose} className="w-full">
            View Job Details
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
