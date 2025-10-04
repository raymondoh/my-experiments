//src/app/api/auth/resend-verification/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { userService } from "@/lib/services/user-service";
import { tokenService } from "@/lib/auth/tokens";
import { emailService } from "@/lib/email/email-service";
import { z } from "zod";

const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address")
});

type OkResponse = { ok: true; message: string };
type ErrorResponse = { ok: false; error: string };

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = resendVerificationSchema.parse(body);

    // Look up user but avoid leaking existence.
    const user = await userService.getUserByEmail(email).catch(() => null);

    // If no user OR already verified → respond generically.
    if (!user || user.emailVerified) {
      return NextResponse.json<OkResponse>(
        { ok: true, message: "If an account exists for that email, we've sent a verification link." },
        { headers: NO_STORE_HEADERS }
      );
    }

    // Create and send a fresh verification token.
    const token = await tokenService.createEmailVerificationToken(email);
    await emailService.sendVerificationEmail(email, token, user.name || undefined);

    return NextResponse.json<OkResponse>(
      { ok: true, message: "If an account exists for that email, we've sent a verification link." },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Resend verification error:", error);

    if (error instanceof z.ZodError) {
      const issue = error.issues?.[0] || (error as unknown as { errors?: { message?: string }[] }).errors?.[0];
      return NextResponse.json<ErrorResponse>(
        { ok: false, error: issue?.message ?? "Invalid request data" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Internal errors: return 500 (doesn't leak account existence).
    return NextResponse.json<ErrorResponse>(
      { ok: false, error: "Failed to resend verification email" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
