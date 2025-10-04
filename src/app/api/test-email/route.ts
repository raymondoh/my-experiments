// src/app/api/test-email/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { Resend } from "resend";
import { z } from "zod";
import { requireSession } from "@/lib/auth/require-session";
import { isAdmin } from "@/lib/auth/roles";

const testEmailSchema = z.object({
  email: z.string().email("Invalid email address")
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication: Ensure the user is logged in.
    const session = await requireSession();

    // 2. Authorization: Ensure the user is an admin.
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log(`🧪 Test Email: Starting email test`);
    console.log(`🧪 RESEND_API_KEY present: ${!!env.RESEND_API_KEY}`);
    console.log(`🧪 EMAIL_FROM: ${env.EMAIL_FROM}`);

    if (!env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 400 });
    }

    const resend = new Resend(env.RESEND_API_KEY);

    const body = await request.json();
    const { email } = testEmailSchema.parse(body);

    console.log(`🧪 Test Email: Sending test email to ${email}`);

    const result = await resend.emails.send({
      from: env.EMAIL_FROM || "onboarding@resend.dev",
      to: email,
      subject: "Test Email from Plumbers Portal",
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify your Resend configuration is working.</p>
        <p>If you received this, your email service is configured correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `
    });

    console.log(`🧪 Test Email: Result:`, result);

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      result
    });
  } catch (error) {
    console.error("🧪 Test Email: Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid email" }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: (error as Error).message || "Failed to send test email",
        details: (error as Error).toString()
      },
      { status: 500 }
    );
  }
}
