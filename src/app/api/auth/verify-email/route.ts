// src/app/api/auth/verify-email/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { tokenService } from "@/lib/auth/tokens";
import { userService } from "@/lib/services/user-service";
import { emailService } from "@/lib/email/email-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const tokenSchema = z.object({
  token: z.string().min(1, "Token is required")
});

// The GET handler has been removed as it is redundant.
// The verification link points to the page at /verify-email,
// which provides a better UX and calls the POST handler below.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = tokenSchema.parse(body);

    const tokenResult = await tokenService.verifyAndConsumeEmailVerificationToken(token);

    if (!tokenResult.valid || !tokenResult.email) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        {
          status: 400,
          headers: NO_STORE_HEADERS
        }
      );
    }

    const emailVerified = await userService.verifyUserEmail(tokenResult.email);
    if (!emailVerified) {
      return NextResponse.json({ error: "Failed to verify email" }, { status: 500, headers: NO_STORE_HEADERS });
    }

    const user = await userService.getUserByEmail(tokenResult.email);

    if (user && user.email) {
      if (user.role === "tradesperson") {
        await emailService.sendTradespersonWelcomeEmail(user.email, user.name || "");
      } else if (user.role === "customer") {
        await emailService.sendCustomerWelcomeEmail(user.email, user.name || "");
      }
    }
    const redirectPath =
      user && !user.onboardingComplete
        ? user.role === "tradesperson"
          ? "/onboarding/tradesperson"
          : "/onboarding/customer"
        : "/dashboard";

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully",
        role: user?.role,
        redirectPath
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid token" },
        {
          status: 400,
          headers: NO_STORE_HEADERS
        }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: NO_STORE_HEADERS
      }
    );
  }
}
