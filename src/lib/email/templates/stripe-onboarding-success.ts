// src/lib/email/templates/stripe-onboarding-success.ts
import { getURL } from "@/lib/utils";

export function stripeOnboardingSuccessEmail(name: string) {
  const jobBoardUrl = getURL("/dashboard/tradesperson/job-board");

  return {
    subject: "You're all set to get paid!",
    html: `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f5f7fb; padding: 24px 0; font-family: Arial, sans-serif; color: #1f2933;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 8px; padding: 32px;">
              <tr>
                <td>
                  <h1 style="font-size: 24px; margin-bottom: 16px; color: #0f5132;">Fantastic news, ${name || "there"}!</h1>
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                    Your Stripe account is now connected and ready to go. That means you can receive payments directly to your bank account for every job you complete on Plumbers Portal.
                  </p>
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                    Keep the momentum going by checking out the latest jobs waiting for you.
                  </p>
                  <p style="text-align: center;">
                    <a href="${jobBoardUrl}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">View Job Board</a>
                  </p>
                  <p style="font-size: 14px; line-height: 1.6; margin-top: 24px; color: #52606d;">
                    If you have any questions, just reply to this email and our team will be happy to help.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
  };
}
