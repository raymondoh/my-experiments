//src/app/api/reset-password/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { tokenService } from "@/lib/auth/tokens";
import { userService } from "@/lib/services/user-service"; // UPDATED: Import the new service
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // UPDATED: Use the correct method to verify and consume the token
    const email = await tokenService.consumePasswordResetToken(token);

    if (!email) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // UPDATED: Use the new userService to update the password
    const success = await userService.updateUserPassword(email, password);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successfully"
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    if (error instanceof z.ZodError) {
      const issue = error.issues?.[0] || (error as { errors?: { message?: string }[] }).errors?.[0];
      return NextResponse.json(
        { error: issue?.message ?? "Invalid request data" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
    return NextResponse.json(
      { error: "Password reset failed" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
