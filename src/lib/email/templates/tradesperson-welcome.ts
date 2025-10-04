// src/lib/email/templates/tradesperson-welcome.ts
import { getURL } from "@/lib/utils";

export function tradespersonWelcomeEmail(name: string) {
  const profileUrl = getURL("/dashboard/tradesperson/profile/edit");

  return {
    subject: "Welcome to Plumbers Portal! Here's how to get started.",
    html: `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f5f7fb; padding: 24px 0; font-family: Arial, sans-serif; color: #1f2933;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 8px; padding: 32px;">
              <tr>
                <td>
                  <h1 style="font-size: 24px; margin-bottom: 16px; color: #004085;">Welcome aboard, ${name || "there"}!</h1>
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                    Congratulations on joining the Plumbers Portal network. We're excited to help you grow your business with new opportunities.
                  </p>
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                    The most important first step is to complete your professional profile. A complete profile helps customers feel confident choosing you and ensures you start receiving the right jobs.
                  </p>
                  <p style="text-align: center;">
                    <a href="${profileUrl}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Complete Your Profile</a>
                  </p>
                  <p style="font-size: 14px; line-height: 1.6; margin-top: 24px; color: #52606d;">
                    Need help? Reply to this email and our team will get you on track right away.
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
