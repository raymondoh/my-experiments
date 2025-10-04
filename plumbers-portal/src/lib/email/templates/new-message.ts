// src/lib/email/templates/new-message.ts
import { getURL } from "@/lib/utils";

/**
 * Generates the HTML content for an email notifying a user of a new message.
 * @param jobId The ID of the job the message is related to.
 * @param message The content of the message.
 * @param senderName The name of the person who sent the message.
 * @returns The HTML string for the email body.
 */
export function getNewMessageEmailTemplate(jobId: string, message: string, senderName: string) {
  // --- THIS IS THE FIX ---
  // The URL now correctly points to the messaging dashboard for the specific job.
  const conversationUrl = getURL(`/dashboard/messages/${jobId}`);

  return {
    subject: `New message from ${senderName}`,
    html: `
    <p><strong>You have a new message regarding a job.</strong></p>
    <p><strong>From:</strong> ${senderName}</p>
    <p><strong>Message:</strong></p>
    <blockquote style="border-left: 4px solid #ccc; padding-left: 1rem; margin-left: 0; font-style: italic;">
      ${message}
    </blockquote>
    <br>
    <p><a href="${conversationUrl}" style="background-color: #007bff; color: #ffffff; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Reply to Message</a></p>
    <br>
    <p>Thank you for using our platform.</p>
  `
  };
}
