// src/lib/email/templates/quote-accepted.ts
import { getURL } from "@/lib/utils";

/**
 * Generates the HTML content for an email notifying a tradesperson
 * that their quote has been accepted by the customer.
 * @param jobId The ID of the job for which the quote was accepted.
 * @returns The HTML string for the email body.
 */
export function quoteAcceptedEmail(jobId: string) {
  // --- THIS IS THE FIX ---
  // The URL now correctly points to the tradesperson's dashboard view for the specific job.
  const jobUrl = getURL(`/dashboard/tradesperson/job-board/${jobId}`);

  return {
    subject: "Congratulations! Your quote has been accepted.",
    html: `
    <p><strong>Congratulations! Your quote has been accepted.</strong></p>
    <p>A customer has accepted your quote for a job. You can now view the full job details and the customer's contact information to arrange a start date.</p>
    <p>We recommend contacting the customer as soon as possible to confirm the details.</p>
    <br>
    <p><a href="${jobUrl}" style="background-color: #007bff; color: #ffffff; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View Job & Contact Customer</a></p>
    <br>
    <p>Thank you for using our platform.</p>
  `
  };
}
