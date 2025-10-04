// src/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { env } from "@/lib/env";
import type { Session } from "next-auth";
import { AuthError } from "next-auth";
import { logDev, warnDev } from "@/lib/utils/logger";
import { getDashboardRoute } from "@/lib/auth-utils";

// A custom error class for the unverified email case
class UnverifiedEmailError extends AuthError {
  constructor(message?: string) {
    super(message);
    this.type = "CredentialsSignin";
    this.cause = { err: new Error("unverified") };
  }
}

const {
  handlers,
  auth: nextAuthAuth,
  signIn,
  signOut
} = NextAuth({
  pages: { signIn: "/login", error: "/login" },

  callbacks: {
    async signIn({ user, account }) {
      logDev("\n--- [auth.ts] signIn callback triggered ---");
      logDev("Provider:", account?.provider);

      if (account?.provider === "google") {
        try {
          const { userService } = await import("@/lib/services/user-service");
          logDev("Calling userService.findOrCreateUser for:", user.email);

          const dbUser = await userService.findOrCreateUser({
            email: user.email!,
            name: user.name!,
            profilePicture: user.image,
            authProvider: account.provider,
            role: "customer"
          });

          logDev("Result from findOrCreateUser:", dbUser);

          if (!dbUser) {
            logDev("findOrCreateUser returned null. Aborting sign-in.");
            return false;
          }

          // Enrich the NextAuth user object with data from your database
          user.id = dbUser.id;
          user.role = dbUser.role;
          user.onboardingComplete = dbUser.onboardingComplete;
          user.emailVerified = dbUser.emailVerified ?? null;

          logDev("Enriched NextAuth user object:", user);
        } catch (error) {
          console.error("!!! ERROR in signIn callback:", error);
          return false;
        }
      }
      logDev("--- [auth.ts] signIn successful, returning true ---");
      return true;
    },

    authorized({ auth, request: { nextUrl } }) {
      logDev("[auth.authorized] Checking authorization...");
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      logDev(`[auth.authorized] isLoggedIn: ${isLoggedIn}, role: ${userRole}, pathname: ${nextUrl.pathname}`);

      const isAuthRoute = ["/login", "/register", "/forgot-password", "/reset-password"].some(route =>
        nextUrl.pathname.startsWith(route)
      );

      const dashboardRoute = getDashboardRoute(userRole);

      if (isLoggedIn) {
        logDev("[auth.authorized] User is logged in.");
        if (isAuthRoute) {
          const redirectUrl = new URL(dashboardRoute, nextUrl);
          logDev(`[auth.authorized] User on auth route, redirecting to ${redirectUrl.toString()}`);
          return Response.redirect(redirectUrl);
        }
        if (nextUrl.pathname === "/dashboard") {
          const redirectUrl = new URL(dashboardRoute, nextUrl);
          logDev(`[auth.authorized] User on /dashboard, redirecting to ${redirectUrl.toString()}`);
          return Response.redirect(redirectUrl);
        }

        const isCustomerPath = nextUrl.pathname.startsWith("/dashboard/customer");
        const isTradespersonPath = nextUrl.pathname.startsWith("/dashboard/tradesperson");
        const isAdminPath = nextUrl.pathname.startsWith("/dashboard/admin");

        if (isCustomerPath && userRole !== "customer") {
          const redirectUrl = new URL(dashboardRoute, nextUrl);
          logDev(`[auth.authorized] Wrong role for customer path, redirecting to ${redirectUrl.toString()}`);
          return Response.redirect(redirectUrl);
        }
        if (isTradespersonPath && !["tradesperson", "admin"].includes(userRole ?? "")) {
          const redirectUrl = new URL(dashboardRoute, nextUrl);
          logDev(`[auth.authorized] Wrong role for tradesperson path, redirecting to ${redirectUrl.toString()}`);
          return Response.redirect(redirectUrl);
        }
        if (isAdminPath && userRole !== "admin") {
          const redirectUrl = new URL(dashboardRoute, nextUrl);
          logDev(`[auth.authorized] Wrong role for admin path, redirecting to ${redirectUrl.toString()}`);
          return Response.redirect(redirectUrl);
        }

        logDev("[auth.authorized] Authorization successful.");
        return true;
      }

      logDev("[auth.authorized] User is NOT logged in.");
      if (!isAuthRoute && !nextUrl.pathname.startsWith("/api/auth")) {
        const redirectUrl = new URL("/login", nextUrl);
        logDev(`[auth.authorized] Not on auth route, redirecting to ${redirectUrl.toString()}`);
        return Response.redirect(redirectUrl);
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // This block runs on initial sign-in to populate the token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.picture = user.image; // NextAuth uses 'picture' for the image URL
        token.emailVerified = user.emailVerified;
        token.onboardingComplete = user.onboardingComplete;
        token.subscriptionTier = user.subscriptionTier;
        token.subscriptionStatus = user.subscriptionStatus;
      }

      // --- THIS IS THE FIX ---
      // This block runs when you call `update()` from a client component
      if (trigger === "update" && session?.user) {
        // Update the token with the new name and image from the client
        token.name = session.user.name;
        token.picture = session.user.image;
      }
      // --- END OF FIX ---

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Session["user"]["role"];
        session.user.emailVerified = token.emailVerified as Date | null;
        session.user.onboardingComplete = token.onboardingComplete as boolean;
        session.user.subscriptionTier = token.subscriptionTier as Session["user"]["subscriptionTier"];
        session.user.subscriptionStatus = token.subscriptionStatus as Session["user"]["subscriptionStatus"];

        // --- THIS IS THE FIX ---
        // Ensure the session object reflects the updated name and image from the token
        session.user.name = token.name;
        session.user.image = token.picture as string | null;
        // --- END OF FIX ---
      }
      return session;
    }
  },

  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET
    }),
    Credentials({
      async authorize(credentials) {
        logDev("[auth.authorize] Authorize callback triggered.");
        if (!credentials?.email || !credentials.password) {
          logDev("[auth.authorize] Missing credentials.");
          return null;
        }

        logDev(`[auth.authorize] Validating credentials for: ${credentials.email}`);
        const { userService } = await import("@/lib/services/user-service");
        const u = await userService.validateCredentials(credentials.email as string, credentials.password as string);

        if (!u) {
          logDev(`[auth.authorize] Invalid credentials for: ${credentials.email}`);
          const userExists = await userService.getUserByEmail(credentials.email as string);
          if (userExists && !userExists.emailVerified) {
            logDev(`[auth.authorize] User exists but email is not verified: ${credentials.email}`);
            throw new UnverifiedEmailError("Email has not been verified.");
          }
          return null;
        }

        logDev(`[auth.authorize] Credentials valid for: ${credentials.email}`);

        if (!u.emailVerified) {
          warnDev(`[auth.authorize] LOGIN BLOCKED: Email not verified for ${u.email}`);
          throw new UnverifiedEmailError("Email has not been verified.");
        }

        logDev(`[auth.authorize] User verified, returning user object for session creation.`);
        return {
          id: u.id,
          email: u.email,
          name: u.name ?? null,
          image: u.image ?? null,
          role: (u.role as Session["user"]["role"]) ?? "customer",
          emailVerified: u.emailVerified,
          onboardingComplete: Boolean(u.onboardingComplete),
          subscriptionTier: u.subscriptionTier as Session["user"]["subscriptionTier"],
          subscriptionStatus: (u.subscriptionStatus ?? null) as Session["user"]["subscriptionStatus"]
        };
      }
    })
  ],

  session: { strategy: "jwt" },
  secret: env.AUTH_SECRET || "insecure-development-secret"
});

// --- Exports ---
export const auth = nextAuthAuth;

export async function getSessionSafe(): Promise<Session | null> {
  try {
    return await (nextAuthAuth as unknown as () => Promise<Session | null>)();
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name: string }).name === "JWTSessionError"
    ) {
      return null;
    }
    throw error;
  }
}

export { handlers, signIn, signOut };
