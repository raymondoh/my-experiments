// src/components/subscriptions/payment-success-modal.tsx

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
import { CheckCircle2, Rocket, Briefcase } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [plan, setPlan] = useState("");

  useEffect(() => {
    const successParam = searchParams.get("payment_success");
    const planParam = searchParams.get("plan");

    if (successParam) {
      setPlan(planParam || "Pro"); // Set the plan, with a default
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
        {/* ACCESSIBILITY FIX: A title is present but visually hidden */}
        <AlertDialogTitle className="sr-only">Upgrade Successful</AlertDialogTitle>
        <AlertDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <AlertDialogDescription className="text-center pt-4 text-lg font-medium text-foreground">
            Welcome to the {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan!
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="text-center text-sm text-muted-foreground py-2">
          Here are a couple of things you can do now to get the most out of your new features:
        </div>

        {/* Onboarding / Next Steps Links */}
        <div className="space-y-3 pt-2">
          <Link href="/dashboard/tradesperson/profile/edit" onClick={handleClose} className="block">
            <div className="flex-1 text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Rocket className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm">Feature Your Profile</p>
                  <p className="text-xs text-muted-foreground">Update your details to stand out in search results.</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/dashboard/tradesperson/job-board" onClick={handleClose} className="block">
            <div className="flex-1 text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm">Find Exclusive Jobs</p>
                  <p className="text-xs text-muted-foreground">Start quoting on jobs reserved for Pro members.</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <AlertDialogFooter className="mt-4">
          <AlertDialogAction onClick={handleClose} className="w-full">
            Continue to Dashboard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
