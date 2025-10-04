// src/actions/auth/login.ts
"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { logDev } from "@/lib/utils";
import { z } from "zod";
import { getDashboardRoute } from "@/lib/auth-utils";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." })
});

export type LoginFormState = {
  errors?: {
    email?: string[];
    password?: string[];
    _form?: string[];
  };
  success?: boolean;
  message?: string;
  redirectUrl?: string;
  // --- New fields for unverified email flow ---
  unverifiedEmail?: boolean;
  resendHintEmail?: string;
};

export async function loginAction(prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  logDev("--- [loginAction] Start ---");

  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors
    };
  }

  const { email, password } = validatedFields.data;

  logDev(`[loginAction] Attempting login for email: ${email}`);

  try {
    logDev("[loginAction] Calling NextAuth signIn...");
    await signIn("credentials", {
      email,
      password,
      redirect: false // IMPORTANT: must be false to handle errors here
    });
    logDev("[loginAction] NextAuth signIn call completed without throwing.");
  } catch (error: unknown) {
    console.error("[loginAction] signIn threw an error:", error);

    // Check for specific NextAuth errors
    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      // Check if the error message is our custom "unverified" message from `authorize`
      if (error.cause?.err?.message === "unverified") {
        logDev(`[loginAction] User found but email not verified: ${email}`);
        return {
          unverifiedEmail: true,
          resendHintEmail: email, // Pass email back to the form for the resend button
          errors: {
            _form: ["Email not verified."]
          }
        };
      }
      logDev("[loginAction] Invalid credentials error caught.");
      return { errors: { _form: ["Invalid email or password."] } };
    }
    // For other unexpected errors, re-throw them so Next.js can handle it
    logDev("[loginAction] Rethrowing unexpected error.");
    throw error;
  }

  // --- This part will only be reached on successful signIn ---
  logDev(`[loginAction] Login successful for ${email}. Determining redirect...`);

  const { userService } = await import("@/lib/services/user-service");
  const user = await userService.getUserByEmail(email);
  const role = user?.role;

  // Use the getDashboardRoute utility to determine the correct path
  const redirectUrl = getDashboardRoute(role);

  logDev(`[loginAction] Redirecting to: ${redirectUrl}`);

  return { success: true, redirectUrl };
}
