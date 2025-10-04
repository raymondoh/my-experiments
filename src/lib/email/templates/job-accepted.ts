// src/lib/email/templates/job-accepted.ts
import { getURL } from "@/lib/utils";

/**
 * Generates the HTML content for an email notifying a tradesperson
 * that their quote for a job has been accepted.
 * @param jobId The ID of the job.
 * @returns The HTML string for the email body.
 */
export function jobAcceptedEmail(jobId: string) {
  // --- THIS IS THE FIX ---
  // The URL now correctly points to the tradesperson's dashboard view for that specific job.
  const jobUrl = getURL(`/dashboard/tradesperson/job-board/${jobId}`);

  return {
    subject: "You have accepted a quote!",
    html: `
   <p><strong>You have accepted a quote!</strong></p>
    <p>Thank you for choosing a tradesperson for your job. We have notified them that you have accepted their quote, and they should be in touch shortly to arrange a time to start the work.</p>
    <p>You can view the job details and communicate with the tradesperson through your dashboard.</p>
    <br>
    <p><a href="${jobUrl}" style="background-color: #007bff; color: #ffffff; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View Job Details</a></p>
    <br>
    <p>Thank you for using our platform.</p>
  `
  };
}
