// src/actions/jobs/accept-quote.ts

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { jobService } from "@/lib/services/job-service";

export async function acceptQuote(formData: FormData) {
  console.log("\n--- [ACTION] acceptQuote: Initiated ---");
  const session = await requireSession();

  if (session.user.role !== "customer") {
    throw new Error("Forbidden: Only customers can accept quotes.");
  }

  const jobId = formData.get("jobId") as string;
  const quoteId = formData.get("quoteId") as string;
  console.log(`[ACTION] acceptQuote: Processing Job ID: ${jobId}, Quote ID: ${quoteId}`);

  await jobService.acceptQuote(jobId, quoteId, session.user.id);
  console.log(`[ACTION] acceptQuote: jobService.acceptQuote completed successfully.`);

  const quotesPagePath = `/dashboard/customer/jobs/${jobId}/quotes`;
  revalidatePath(quotesPagePath);
  console.log(`[ACTION] acceptQuote: Revalidated path: ${quotesPagePath}`);

  const redirectUrl = `${quotesPagePath}?quote_accepted=true`;
  console.log(`[ACTION] acceptQuote: Redirecting to: ${redirectUrl}`);
  redirect(redirectUrl);
}
