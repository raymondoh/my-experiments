// src/lib/email/templates/new-quote.ts
import { getURL } from "@/lib/utils";

/**
 * Generates the HTML content for an email notifying a customer
 * that they have received a new quote for their job.
 * @param jobId The ID of the job that received the quote.
 * @returns The HTML string for the email body.
 */
export function newQuoteEmail(jobId: string) {
  // --- THIS IS THE FIX ---
  // The URL now correctly points to the customer's quote review page for the specific job.
  const quotesUrl = getURL(`/dashboard/customer/jobs/${jobId}/quotes`);

  return {
    subject: "You've received a new quote!",
    html: `
    <p><strong>You've received a new quote!</strong></p>
    <p>A tradesperson has submitted a new quote for one of your jobs. You can view the details, compare it with other quotes, and accept it directly on our platform.</p>
    <br>
    <p><a href="${quotesUrl}" style="background-color: #007bff; color: #ffffff; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View New Quote</a></p>
    <br>
    <p>Thank you for using our platform.</p>
  `
  };
}
