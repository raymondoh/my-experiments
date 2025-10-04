// src/app/api/auth/forgot-password/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { userService } from "@/lib/services/user-service";
import { tokenService } from "@/lib/auth/tokens";
import { emailService } from "@/lib/email/email-service";
import { strictRateLimiter } from "@/lib/rate-limiter";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address")
});

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await strictRateLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: NO_STORE_HEADERS });
  }

  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    console.log(`🔐 Password reset requested for: ${email}`);
    const user = await userService.getUserByEmail(email);

    if (user) {
      const token = await tokenService.createPasswordResetToken(email);
      await emailService.sendPasswordResetEmail(email, token, user.name || undefined);
      console.log(`✅ Password reset email sent to: ${email}`);
    } else {
      console.log(`- User with email ${email} not found, but sending generic success response.`);
    }

    return NextResponse.json(
      {
        success: true,
        message: "If an account with that email exists, we have sent a password reset link."
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Password reset request error:", error);

    if (error instanceof z.ZodError) {
      const issue = error.issues?.[0] || (error as unknown as { errors?: { message?: string }[] }).errors?.[0];
      return NextResponse.json(
        { error: issue?.message ?? "Invalid request data" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "If an account with that email exists, we have sent a password reset link."
      },
      { headers: NO_STORE_HEADERS }
    );
  }
}
