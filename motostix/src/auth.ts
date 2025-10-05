import "server-only";

/**
 * Centralized NextAuth entrypoint for MotoStix.
 * - Provides a single source of truth for helpers and route handlers.
 * - Propagates user roles through JWT and session callbacks.
 * - Implements safe redirects that honor ?next=/... and ?callbackUrl=/....
 */
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { cert } from "firebase-admin/app";

import { serverEnv } from "@/lib/env";
import { syncUserWithFirebase } from "@/lib/auth/syncUserWithFirebase";
import { handleProviderSync } from "@/lib/auth/sync";
import type { UserRole } from "@/types/user";
import type { User as FirestoreUser } from "@/types/user/common";

type ExtendedUser = AdapterUser & {
  sub?: string;
  bio?: string;
  picture?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role?: UserRole;
};

function sanitizeRelativePath(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

function getFirebaseAdminConfig() {
  try {
    return {
      credential: cert({
        projectId: serverEnv.FIREBASE_PROJECT_ID,
        clientEmail: serverEnv.FIREBASE_CLIENT_EMAIL,
        privateKey: serverEnv.FIREBASE_PRIVATE_KEY,
      }),
    };
  } catch (error) {
    console.error("Error creating Firebase Admin credential:", error);
    return null;
  }
}

function createFirestoreAdapter(): Adapter | undefined {
  const config = getFirebaseAdminConfig();
  if (!config) {
    console.warn("Skipping FirestoreAdapter creation due to missing config");
    return undefined;
  }

  try {
    return FirestoreAdapter(config) as Adapter;
  } catch (error) {
    console.error("Failed to create FirestoreAdapter:", error);
    return undefined;
  }
}

export const authConfig = {
  adapter: createFirestoreAdapter(),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    Google({
      clientId: serverEnv.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: serverEnv.AUTH_GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Credentials({
      name: "Firebase",
      credentials: {
        idToken: { label: "ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken || typeof credentials.idToken !== "string") {
          throw new Error("Invalid ID token");
        }

        try {
          const { getAdminAuth } = await import("@/lib/firebase/admin/initialize");
          const adminAuth = getAdminAuth();
          const decodedToken = await adminAuth.verifyIdToken(credentials.idToken);
          const uid = decodedToken.uid;
          const email = decodedToken.email;

          if (!email) {
            throw new Error("No email in token");
          }

          const userRecord = await adminAuth.getUser(uid);
          const provider = decodedToken.firebase?.sign_in_provider || "unknown";

          const { role } = await syncUserWithFirebase(uid, {
            email,
            name: userRecord.displayName || undefined,
            image: userRecord.photoURL || undefined,
            provider,
          });

          return {
            id: uid,
            email,
            name: userRecord.displayName || email.split("@")[0],
            firstName: undefined,
            lastName: undefined,
            displayName: userRecord.displayName || email.split("@")[0],
            image: userRecord.photoURL || undefined,
            role,
          } satisfies ExtendedUser;
        } catch (error) {
          console.error("Error verifying Firebase ID token:", error);
          throw new Error("Invalid ID token");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      console.log("[NextAuth Callback] JWT: START");
      console.log("  Initial token:", token);
      console.log("  User object (from provider/adapter):", user);
      console.log("  Account object:", account);

      const { getAdminFirestore } = await import("@/lib/firebase/admin/initialize");

      if (token.uid) {
        try {
          const userDoc = await getAdminFirestore()
            .collection("users")
            .doc(token.uid as string)
            .get();
          const firestoreData = userDoc.data() as FirestoreUser | undefined;

          if (firestoreData) {
            token.firstName = firestoreData.firstName;
            token.lastName = firestoreData.lastName;
            token.displayName = firestoreData.displayName;
            token.bio = firestoreData.bio;
            token.email = firestoreData.email || token.email;
            token.picture =
              firestoreData.picture || firestoreData.image || firestoreData.photoURL;
            token.name = firestoreData.name || firestoreData.displayName || token.name;
            console.log(
              "[NextAuth Callback] JWT: Firestore data fetched and assigned to token:",
              firestoreData,
            );
          }
        } catch (error) {
          console.error(
            "[NextAuth Callback] JWT: Error fetching user data from Firestore:",
            error,
          );
        }
      }

      if (user && account) {
        try {
          const { role, uid } = await handleProviderSync(user as ExtendedUser, account);
          token.uid = uid;
          token.role = role;
        } catch (error) {
          console.error(
            `[NextAuth Callback] JWT: Error syncing ${account.provider} user with Firebase:`,
            error,
          );
        }
      }

      const extendedUser = user as ExtendedUser;
      if (extendedUser?.email) token.email = extendedUser.email;
      if (extendedUser?.name) token.name = extendedUser.name;
      if (extendedUser?.picture) token.picture = extendedUser.picture;
      if (extendedUser?.bio) token.bio = extendedUser.bio;
      if (extendedUser?.firstName) token.firstName = extendedUser.firstName;
      if (extendedUser?.lastName) token.lastName = extendedUser.lastName;
      if (extendedUser?.displayName) token.displayName = extendedUser.displayName;
      if (extendedUser?.role && !token.role) token.role = extendedUser.role;

      if (!token.role) {
        token.role = "user";
      }

      console.log("[NextAuth Callback] JWT: Final token:", token);
      return token;
    },
    async session({ session, token }) {
      console.log("[NextAuth Callback] Session: START");
      console.log("  Initial session:", session);
      console.log("  Token object (from JWT callback):", token);

      const isValidRole = (role: unknown): role is UserRole => role === "admin" || role === "user";

      if (token && session.user) {
        session.user.id = token.uid as string;
        session.user.email = token.email as string;
        session.user.role = isValidRole(token.role) ? token.role : "user";

        session.user.firstName = token.firstName as string | undefined;
        session.user.lastName = token.lastName as string | undefined;
        session.user.displayName = token.displayName as string | undefined;

        session.user.name = token.name as string | undefined;
        session.user.image = token.picture as string | undefined;
        session.user.bio = token.bio as string | undefined;

        console.log("[NextAuth Callback] Session: Final session.user:", session.user);
      } else {
        console.warn("[NextAuth Callback] Session: Token or session.user missing.");
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        const parsed = new URL(url, baseUrl);
        const callbackTarget =
          sanitizeRelativePath(parsed.searchParams.get("callbackUrl")) ??
          sanitizeRelativePath(parsed.searchParams.get("next"));

        if (callbackTarget) {
          return callbackTarget;
        }

        if (parsed.origin === baseUrl) {
          return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      } catch {
        const fallback = sanitizeRelativePath(url);
        if (fallback) {
          return fallback;
        }
      }

      return "/";
    },
  },
  events: {
    async signIn({ user, account }) {
      console.log(`User signed in with ${account?.provider}:`, user?.email);
    },
    async signOut(message) {
      if ("session" in message) {
        console.log("User signed out with session:", message.session);
      }
      if ("token" in message) {
        console.log("User signed out with token:", message.token);
      }
    },
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig;

export { auth, signIn, signOut } from "next-auth";
export const {
  handlers: { GET, POST },
} = NextAuth(authConfig);
