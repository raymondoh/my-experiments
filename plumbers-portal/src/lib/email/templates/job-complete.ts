// src/lib/email/templates/job-complete.ts
import { getURL } from "@/lib/utils";

/**
 * Generates the HTML content for an email notifying a customer
 * that their job has been marked as complete.
 * @param jobId The ID of the completed job.
 * @returns The HTML string for the email body.
 */
export function jobCompleteEmail(jobId: string) {
  // --- THIS IS THE FIX ---
  // The URL now correctly points to the customer's dashboard view for the specific job.
  const jobUrl = getURL(`/dashboard/customer/jobs/${jobId}`);
  const reviewUrl = getURL(`/dashboard/customer/jobs/${jobId}/review`);

  return {
    subject: "Your job has been marked as complete!",
    html: `
    <p><strong>Your job has been marked as complete!</strong></p>
    <p>We hope everything went well. Your feedback is valuable to our community and helps other customers make informed decisions.</p>
    <p>Please take a moment to leave a review for the tradesperson.</p>
    <br>
    <p><a href="${reviewUrl}" style="background-color: #007bff; color: #ffffff; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Leave a Review</a></p>
    <br>
    <p>You can also view the completed job details here:</p>
    <p><a href="${jobUrl}">View Job Details</a></p>
    <br>
    <p>Thank you for using our platform.</p>
  `
  };
}
