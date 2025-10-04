import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditCard, CheckCircle } from "lucide-react"; // Import CheckCircle
import type { Job, PaymentStatus } from "@/lib/types/job";
import type { Quote } from "@/lib/types/quote";
import PayDepositButton from "@/components/payments/pay-deposit-button";
import PayFinalBalanceButton from "@/components/payments/pay-final-balance-button";
import { Badge } from "@/components/ui/badge"; // Import Badge

export function PaymentSummary({ job, quote }: { job: Job; quote: Quote }) {
  const total = quote.price;
  const deposit = quote.depositAmount ?? 0;
  const depositPaidStatuses = new Set<PaymentStatus>([
    "deposit_paid",
    "pending_final",
    "fully_paid",
    "authorized",
    "captured",
    "succeeded"
  ]);
  const paymentStatus = job.paymentStatus ?? null;
  const hasDepositBeenPaid = paymentStatus ? depositPaidStatuses.has(paymentStatus) : false;
  const isFullyPaid = paymentStatus === "fully_paid";

  const paidAmount = isFullyPaid ? total : hasDepositBeenPaid ? deposit : 0;
  const remaining = Math.max(total - paidAmount, 0);

  const shouldShowDepositButton = job.status === "assigned" && deposit > 0 && !hasDepositBeenPaid;

  const shouldShowFinalButton = job.status === "completed" && hasDepositBeenPaid && !isFullyPaid && remaining > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Payment Summary
        </CardTitle>
        <CardDescription>A summary of the quote and payments for this job.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* --- THIS IS THE FIX --- */}
        {/* Add a Badge to clearly show the payment status */}
        {hasDepositBeenPaid && (
          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800">
            <CheckCircle className="mr-1.5 h-4 w-4" />
            {isFullyPaid ? "Fully Paid" : "Deposit Paid"}
          </Badge>
        )}
        {/* --- END OF FIX --- */}

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Quote</span>
          <span className="font-semibold">£{total.toFixed(2)}</span>
        </div>
        {deposit > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Deposit</span>
            <span className="font-semibold">£{deposit.toFixed(2)}</span>
          </div>
        )}
        <div className={`flex justify-between items-center ${paidAmount > 0 ? "text-green-600" : ""}`}>
          <span className="text-muted-foreground">Paid</span>
          <span className="font-semibold">£{paidAmount.toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center text-lg">
          <span className="font-bold">Remaining Balance</span>
          <span className="font-bold">£{remaining.toFixed(2)}</span>
        </div>
        {shouldShowDepositButton && <PayDepositButton job={job} quote={quote} />}
        {shouldShowFinalButton && <PayFinalBalanceButton jobId={job.id} quoteId={quote.id} />}
        {isFullyPaid && (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Paid in full
          </div>
        )}
      </CardContent>
    </Card>
  );
}
