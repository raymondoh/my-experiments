//src/app/api/auth/verify-reset-token/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { tokenService } from "@/lib/auth/tokens";
import { z } from "zod";

const verifyTokenSchema = z.object({
  token: z.string().min(1, "Token is required")
});

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = verifyTokenSchema.parse(body);

    // This method will now exist in our updated TokenService
    const tokenResult = await tokenService.checkToken(token, "password_reset");

    if (!tokenResult.valid) {
      return NextResponse.json(
        { error: tokenResult.error || "Invalid or expired token" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Token is valid",
        email: tokenResult.email
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues?.[0] || (error as { errors?: { message?: string }[] }).errors?.[0];
      return NextResponse.json(
        { error: issue?.message ?? "Invalid request data" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
    console.error("Token verification error:", error);
    return NextResponse.json(
      { error: "Token verification failed" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
