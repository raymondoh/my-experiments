// src/lib/email/email-service.ts
import { config } from "@/lib/config/app-mode";
import { env } from "@/lib/env";
import { Resend } from "resend";
import type { Job } from "@/lib/types/job";
import {
  newQuoteEmail,
  quoteAcceptedEmail,
  jobCompleteEmail,
  getNewMessageEmailTemplate,
  jobAcceptedEmail,
  reviewLeftEmail,
  newJobAlertEmail,
  getDepositPaidEmailTemplate,
  customerWelcomeEmailTemplate,
  tradespersonWelcomeEmail,
  stripeOnboardingSuccessEmail,
  stripeOnboardingReminderEmail
} from "./templates";

export interface IEmailService {
  sendVerificationEmail(email: string, token: string, name?: string): Promise<boolean>;
  sendPasswordResetEmail(email: string, token: string, name?: string): Promise<boolean>;
  sendWelcomeEmail(email: string, name?: string): Promise<boolean>;
  sendCustomerWelcomeEmail(to: string, name: string): Promise<boolean>;
  sendTradespersonWelcomeEmail(to: string, name: string): Promise<boolean>;
  sendStripeOnboardingSuccessEmail(to: string, name: string): Promise<boolean>;
  sendStripeOnboardingReminderEmail(to: string, name: string): Promise<boolean>;
  sendNewQuoteEmail(email: string, jobId: string, quoteId: string): Promise<boolean>;
  sendQuoteAcceptedEmail(email: string, jobId: string, quoteId: string): Promise<boolean>;
  sendJobCompleteEmail(email: string, jobId: string): Promise<boolean>;
  sendNewMessageEmail(email: string, jobId: string, message: string, senderName: string): Promise<boolean>;
  sendJobAcceptedEmail(email: string, jobId: string): Promise<boolean>;
  sendReviewLeftEmail(email: string, tradespersonSlug: string): Promise<boolean>;
  sendNewJobAlertEmail(email: string, job: Job): Promise<boolean>;
  // FIX: Renamed the method to reflect its action (sending) and added the 'to' email parameter.
  sendDepositPaidEmail(
    to: string,
    userType: "customer" | "tradesperson",
    jobTitle: string,
    depositAmount: number
  ): Promise<boolean>;
}

class MockEmailService implements IEmailService {
  async sendVerificationEmail(email: string, token: string, _name?: string): Promise<boolean> {
    console.log(`📧 Mock: Verification email sent to ${email}`);
    console.log(`🔗 Mock: Verification link: ${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`);
    return true;
  }

  async sendPasswordResetEmail(email: string, token: string, _name?: string): Promise<boolean> {
    console.log(`📧 Mock: Password reset email sent to ${email}`);
    console.log(`🔗 Mock: Reset link: ${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`);
    return true;
  }

  async sendWelcomeEmail(email: string, _name?: string): Promise<boolean> {
    console.log(`📧 Mock: Welcome email sent to ${email}`);
    return true;
  }

  async sendCustomerWelcomeEmail(to: string, name: string): Promise<boolean> {
    console.log(`📧 Mock: Customer welcome email sent to ${to} for ${name}`);
    return true;
  }

  async sendTradespersonWelcomeEmail(to: string, name: string): Promise<boolean> {
    console.log(`📧 Mock: Tradesperson welcome email sent to ${to} for ${name}`);
    return true;
  }

  async sendStripeOnboardingSuccessEmail(to: string, name: string): Promise<boolean> {
    console.log(`📧 Mock: Stripe onboarding success email sent to ${to} for ${name}`);
    return true;
  }

  async sendStripeOnboardingReminderEmail(to: string, name: string): Promise<boolean> {
    console.log(`📧 Mock: Stripe onboarding reminder email sent to ${to} for ${name}`);
    return true;
  }

  async sendNewQuoteEmail(email: string, jobId: string, _quoteId: string): Promise<boolean> {
    console.log(`📧 Mock: New quote email sent to ${email} for job ${jobId}`);
    return true;
  }

  async sendQuoteAcceptedEmail(email: string, jobId: string, _quoteId: string): Promise<boolean> {
    console.log(`📧 Mock: Quote accepted email sent to ${email} for job ${jobId}`);
    return true;
  }

  async sendJobCompleteEmail(email: string, jobId: string): Promise<boolean> {
    console.log(`📧 Mock: Job complete email sent to ${email} for job ${jobId}`);
    return true;
  }

  async sendNewMessageEmail(email: string, jobId: string, message: string, senderName: string): Promise<boolean> {
    console.log(`📧 Mock: New message from ${senderName} sent to ${email} for job ${jobId}`);
    return true;
  }

  async sendJobAcceptedEmail(email: string, jobId: string): Promise<boolean> {
    console.log(`📧 Mock: Job accepted email sent to ${email} for job ${jobId}`);
    return true;
  }

  async sendReviewLeftEmail(email: string, tradespersonSlug: string): Promise<boolean> {
    console.log(`📧 Mock: Review left email sent to ${email}`);
    console.log(`🔗 Mock: Profile link: ${env.NEXT_PUBLIC_APP_URL}/profile/tradesperson/${tradespersonSlug}`);
    return true;
  }

  async sendNewJobAlertEmail(email: string, job: Job): Promise<boolean> {
    console.log(`📧 Mock: New job alert email sent to ${email} for job ${job.id}`);
    return true;
  }

  // FIX: Implemented the new 'sendDepositPaidEmail' method for the mock service.
  async sendDepositPaidEmail(
    to: string,
    userType: "customer" | "tradesperson",
    jobTitle: string,
    depositAmount: number
  ): Promise<boolean> {
    const { subject } = getDepositPaidEmailTemplate(userType, jobTitle, depositAmount);
    console.log(`📧 Mock: Deposit paid email ("${subject}") sent to ${to}`);
    return true;
  }
}

class ResendEmailService implements IEmailService {
  private resend: Resend | null;

  constructor() {
    if (!config.isMockMode && env.RESEND_API_KEY) {
      try {
        this.resend = new Resend(env.RESEND_API_KEY);
      } catch (error) {
        console.error(`📧 ResendEmailService: Failed to initialize Resend:`, error);
        this.resend = null;
      }
    } else {
      this.resend = null;
    }
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.resend) {
      console.error(`📧 ResendEmailService: No Resend client available to send email to ${to}`);
      return false;
    }
    try {
      await this.resend.emails.send({
        from: env.EMAIL_FROM || "noreply@yourdomain.com",
        to,
        subject,
        html
      });
      console.log(`📧 Email ("${subject}") sent successfully to: ${to}`);
      return true;
    } catch (error) {
      console.error(`📧 ResendEmailService: Failed to send email ("${subject}") to ${to}:`, error);
      return false;
    }
  }

  sendVerificationEmail(email: string, token: string, name?: string): Promise<boolean> {
    const html = this.getVerificationEmailHtml(token, name);
    return this.sendEmail(email, "Verify your email address", html);
  }

  sendPasswordResetEmail(email: string, token: string, name?: string): Promise<boolean> {
    const html = this.getPasswordResetEmailHtml(token, name);
    return this.sendEmail(email, "Reset your password", html);
  }

  sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
    const html = this.getWelcomeEmailHtml(name);
    return this.sendEmail(email, "Welcome to Plumbers Portal!", html);
  }

  sendCustomerWelcomeEmail(to: string, name: string): Promise<boolean> {
    const html = customerWelcomeEmailTemplate.html(name);
    return this.sendEmail(to, customerWelcomeEmailTemplate.subject, html);
  }

  sendTradespersonWelcomeEmail(to: string, name: string): Promise<boolean> {
    const { subject, html } = tradespersonWelcomeEmail(name);
    return this.sendEmail(to, subject, html);
  }

  sendStripeOnboardingSuccessEmail(to: string, name: string): Promise<boolean> {
    const { subject, html } = stripeOnboardingSuccessEmail(name);
    return this.sendEmail(to, subject, html);
  }

  sendStripeOnboardingReminderEmail(to: string, name: string): Promise<boolean> {
    const { subject, html } = stripeOnboardingReminderEmail(name);
    return this.sendEmail(to, subject, html);
  }

  sendNewQuoteEmail(email: string, jobId: string, _quoteId: string): Promise<boolean> {
    const { subject, html } = newQuoteEmail(jobId);
    return this.sendEmail(email, subject, html);
  }

  sendQuoteAcceptedEmail(email: string, jobId: string, _quoteId: string): Promise<boolean> {
    const { subject, html } = quoteAcceptedEmail(jobId);
    return this.sendEmail(email, subject, html);
  }

  sendJobCompleteEmail(email: string, jobId: string): Promise<boolean> {
    const { subject, html } = jobCompleteEmail(jobId);
    return this.sendEmail(email, subject, html);
  }

  sendNewMessageEmail(email: string, jobId: string, message: string, senderName: string): Promise<boolean> {
    const { subject, html } = getNewMessageEmailTemplate(jobId, message, senderName);
    return this.sendEmail(email, subject, html);
  }

  sendJobAcceptedEmail(email: string, jobId: string): Promise<boolean> {
    const { subject, html } = jobAcceptedEmail(jobId);
    return this.sendEmail(email, subject, html);
  }

  sendReviewLeftEmail(email: string, tradespersonSlug: string): Promise<boolean> {
    const { subject, html } = reviewLeftEmail(tradespersonSlug);
    return this.sendEmail(email, subject, html);
  }

  sendNewJobAlertEmail(email: string, job: Job): Promise<boolean> {
    const { subject, html } = newJobAlertEmail(job);
    return this.sendEmail(email, subject, html);
  }

  // FIX: Implemented the new 'sendDepositPaidEmail' method for the Resend service.
  sendDepositPaidEmail(
    to: string,
    userType: "customer" | "tradesperson",
    jobTitle: string,
    depositAmount: number
  ): Promise<boolean> {
    // It gets the subject and html from your template function
    const { subject, html } = getDepositPaidEmailTemplate(userType, jobTitle, depositAmount);
    // And then calls the generic sendEmail method
    return this.sendEmail(to, subject, html);
  }

  private getVerificationEmailHtml(token: string, name?: string): string {
    const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    return `
      <p>Hi ${name || "there"},</p>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${verifyUrl}">Verify Email Address</a>
      <p>Or copy and paste this link: ${verifyUrl}</p>
    `;
  }

  private getPasswordResetEmailHtml(token: string, name?: string): string {
    const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    return `
      <p>Hi ${name || "there"},</p>
      <p>You requested to reset your password. Click the button below:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>Or copy and paste this link: ${resetUrl}</p>
    `;
  }

  private getWelcomeEmailHtml(name?: string): string {
    const dashboardUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard`;
    return `
      <p>Hi ${name || "there"},</p>
      <p>Welcome to our platform! Your account has been successfully verified.</p>
      <a href="${dashboardUrl}">Go to Dashboard</a>
    `;
  }
  // FIX: Removed the incorrect private 'getDepositPaidEmailTemplate' method.
}

class EmailServiceFactory {
  private static instance: IEmailService | null = null;

  static getInstance(): IEmailService {
    if (!EmailServiceFactory.instance) {
      if (config.isMockMode || !env.RESEND_API_KEY) {
        EmailServiceFactory.instance = new MockEmailService();
      } else {
        EmailServiceFactory.instance = new ResendEmailService();
      }
    }
    return EmailServiceFactory.instance;
  }
}

export const emailService = EmailServiceFactory.getInstance();
