// src/lib/email/templates/review-left.ts
import { getURL } from "@/lib/utils";

/**
 * Generates the HTML content for an email notifying a tradesperson
 * that a new review has been left on their profile.
 * @param tradespersonSlug The slug for the tradesperson's public profile URL.
 * @returns The HTML string for the email body.
 */
export function reviewLeftEmail(tradespersonSlug: string) {
  // --- THIS IS THE FIX ---
  // The URL now correctly points to the tradesperson's public profile page.
  const profileUrl = getURL(`/profile/tradesperson/${tradespersonSlug}`);

  return {
    subject: "You've received a new customer review!",
    html: `
    <p><strong>You've received a new customer review!</strong></p>
    <p>A customer has left feedback on a completed job. New reviews help build your reputation and attract more customers.</p>
    <p>You can view the new review on your public profile page.</p>
    <br>
    <p><a href="${profileUrl}" style="background-color: #007bff; color: #ffffff; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View My Public Profile</a></p>
    <br>
    <p>Thank you for your hard work and dedication.</p>
  `
  };
}
