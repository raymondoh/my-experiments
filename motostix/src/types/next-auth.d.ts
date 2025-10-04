import type { DefaultSession, DefaultUser } from "next-auth";

/**
 * Module augmentation for NextAuth.js session data.
 * Ensures that `session.user.role` is available across the app while
 * preserving the existing custom fields referenced throughout MotoStix.
 */
declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    role?: "user" | "admin";
    firstName?: string;
    lastName?: string;
    displayName?: string;
    bio?: string;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: "user" | "admin";
      firstName?: string;
      lastName?: string;
      displayName?: string;
      bio?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: "user" | "admin";
    firstName?: string;
    lastName?: string;
    displayName?: string;
    bio?: string;
  }
}
