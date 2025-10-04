import { getURL } from "@/lib/utils";

const postJobUrl = getURL("/dashboard/customer/jobs/create");

export const customerWelcomeEmailTemplate = {
  subject: "Welcome to Plumbers Portal! Find Your Perfect Tradesperson Today",
  html: (name: string) => `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f5f7fb; padding: 24px 0; font-family: Arial, sans-serif; color: #1f2933;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 8px; padding: 32px;">
            <tr>
              <td>
                <h1 style="font-size: 24px; margin-bottom: 16px; color: #004085;">Hi ${name || "there"}, welcome to Plumbers Portal!</h1>
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                  We're thrilled to have you join the Plumbers Portal community. You're just a few steps away from solving your home maintenance needs with trusted, qualified professionals.
                </p>
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                  Our platform makes it simple and safe to find reliable tradespeople for any job, big or small.
                </p>
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;"><strong>Ready to get started?</strong></p>
                <p style="text-align: center; margin-bottom: 24px;">
                  <a href="${postJobUrl}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Post Your First Job</a>
                </p>
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                  If you have any questions, don't hesitate to visit our help center or contact our support team.
                </p>
                <p style="font-size: 16px; line-height: 1.6;">
                  Best regards,<br/>
                  The Plumbers Portal Team
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
};
