// src/lib/email/templates/stripe-onboarding-reminder.ts
import { getURL } from "@/lib/utils";

export function stripeOnboardingReminderEmail(name: string) {
  const dashboardUrl = getURL("/dashboard/tradesperson");

  return {
    subject: "Action Required: Set up your payouts",
    html: `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f5f7fb; padding: 24px 0; font-family: Arial, sans-serif; color: #1f2933;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 8px; padding: 32px;">
              <tr>
                <td>
                  <h1 style="font-size: 24px; margin-bottom: 16px; color: #b45309;">Let's finish getting you paid, ${name || "there"}.</h1>
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                    You still need to connect your Stripe account so we can send secure, direct payouts for the jobs you complete on Plumbers Portal.
                  </p>
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                    This quick step keeps your earnings safe and ensures there's no delay when it's time to pay you.
                  </p>
                  <p style="text-align: center;">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Set Up Payouts</a>
                  </p>
                  <p style="font-size: 14px; line-height: 1.6; margin-top: 24px; color: #52606d;">
                    Need a hand? Reply to this email and we'll guide you through the setup.
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
