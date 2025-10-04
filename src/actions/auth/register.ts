// src/actions/auth/register.ts
"use server";

import { z } from "zod";
import { tokenService } from "@/lib/auth/tokens";
import { emailService } from "@/lib/email/email-service";
import { logger } from "@/lib/logger";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password must be less than 100 characters"),
    // --- START: MODIFICATION ---
    // Preprocess the 'terms' field to convert "on" to true before validation
    terms: z.preprocess(
      value => value === "on",
      z.boolean().refine(value => value === true, {
        message: "You must accept the terms and conditions to continue.",
        path: ["terms"]
      })
    ),
    // --- END: MODIFICATION ---
    confirmPassword: z.string(),
    role: z.enum(["customer", "tradesperson"]).default("customer")
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export type RegisterFormState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    role?: string[];
    _form?: string[];
    terms?: string[];
  };
  success?: boolean;
  message?: string;
};

export async function registerAction(prevState: RegisterFormState, formData: FormData): Promise<RegisterFormState> {
  logger.info("Register action called");

  try {
    // Validate form data
    const validatedFields = registerSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
      logger.info("Validation failed", validatedFields.error.flatten().fieldErrors);
      return {
        errors: validatedFields.error.flatten().fieldErrors
      };
    }

    const { name, email, password, role } = validatedFields.data;
    logger.info(`Creating user: ${email} with role: ${role}`);

    // Lazily import userService only when registration is attempted
    const { userService } = await import("@/lib/services/user-service");

    // Check if a user already exists
    const existingUser = await userService.getUserByEmail(email);
    logger.info(`Existing user check: ${existingUser ? "Found" : "Not found"}`);

    if (existingUser) {
      logger.info(`User already exists: ${email}`);
      return {
        errors: {
          email: ["An account with this email already exists"]
        }
      };
    }

    // Create the user
    logger.info("Creating user");
    const user = await userService.createUser(email, password, name, role);

    if (!user) {
      logger.error(`Failed to create user: ${email}`);
      return {
        errors: {
          _form: ["Failed to create account. Please try again."]
        }
      };
    }

    logger.info(`User created successfully: ${user.id}`);

    // Create and send email verification token
    try {
      logger.info("Creating verification token");
      const verificationToken = await tokenService.createEmailVerificationToken(email);

      logger.info("Sending verification email");
      await emailService.sendVerificationEmail(email, verificationToken, name);
      logger.info(`Verification email sent successfully to: ${email}`);
    } catch (emailError) {
      logger.error("Email verification setup failed", emailError);
      // Don't fail the entire registration if the email fails to send
    }

    logger.info(`Registration completed for: ${email}`);

    return {
      success: true,
      message: "Account created successfully! Please check your email to verify your account."
    };
  } catch (error: unknown) {
    logger.error("Registration error", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";

    // Handle specific, known error messages
    if (errorMessage.includes("email-already-in-use")) {
      return { errors: { email: ["An account with this email already exists"] } };
    }
    if (errorMessage.includes("weak-password")) {
      return { errors: { password: ["Password is too weak. Please choose a stronger password."] } };
    }

    return {
      errors: {
        _form: ["Registration failed. Please try again."]
      }
    };
  }
}

export async function googleSignInAction() {
  "use server";
  // Import signIn here to avoid issues with server actions
  const { signIn } = await import("@/auth");
  const { AuthError } = await import("next-auth");

  try {
    await signIn("google", {
      redirectTo: "/dashboard"
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Google sign-in failed. Please try again." };
    }
    throw error;
  }
}
