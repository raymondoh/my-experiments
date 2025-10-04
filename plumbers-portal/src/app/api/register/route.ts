// src/app/api/register/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { userService } from "@/lib/services/user-service";
import { z } from "zod";
import { tokenService } from "@/lib/auth/tokens";
import { emailService } from "@/lib/email/email-service";
import { REGISTERABLE_ROLES, DEFAULT_ROLE } from "@/lib/auth/roles";
import { strictRateLimiter } from "@/lib/rate-limiter";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  // ✅ Use the readonly tuple directly; no mutable tuple cast needed
  role: z.enum(REGISTERABLE_ROLES).default(DEFAULT_ROLE as (typeof REGISTERABLE_ROLES)[number])
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
    const { email, password, name, role } = registerSchema.parse(body);

    // Throws if user already exists
    const user = await userService.createUser(email, password, name, role);

    // Create and send email verification token
    const token = await tokenService.createEmailVerificationToken(email);
    await emailService.sendVerificationEmail(email, token, name);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        message: "Registration successful! Please check your email to verify your account."
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("❌ Registration error:", error);

    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      return NextResponse.json(
        { error: issue?.message ?? "Invalid request data" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Registration failed";

    if (errorMessage.includes("User already exists")) {
      // 409 Conflict is appropriate for already-existing resources
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json({ error: errorMessage }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
