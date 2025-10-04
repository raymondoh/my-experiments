// src/lib/services/user-service.ts
import type { User, UserRole } from "@/types/user";
import { createLogger } from "@/lib/logger";
import {
  getUserProfile,
  listUsers,
  type ListUsersResult,
  type UserProfile,
} from "@/lib/services/users";

const log = createLogger("services.user");

// Types for service responses
type ServiceResponse<T> = { success: true; data: T } | { success: false; error: string };

// User service class
export class UserService {
  // Get users with pagination
  static async getUsers(
    limit = 10,
    startAfter?: string
  ): Promise<
    ServiceResponse<{
      users: User[];
      lastVisible?: string;
    }>
  > {
    "use server";
    try {
      const result: ListUsersResult = await listUsers({ limit, cursor: startAfter ?? null });

      const users: User[] = result.items.map(mapProfileToUser);

      return {
        success: true,
        data: {
          users,
          lastVisible: result.nextCursor ?? undefined,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error occurred while fetching users";

      log.error("get users failed", message);
      return { success: false, error: message };
    }
  }

  // Get current user (safely)
  static async getCurrentUser(): Promise<ServiceResponse<User>> {
    "use server";
    try {
      // Dynamic import to avoid build-time initialization
      const { auth } = await import("@/auth");
      const session = await auth();

      if (!session?.user) {
        return { success: false, error: "No authenticated user found" };
      }

      const profile = await getUserProfile(session.user.id);
      const role = profile?.role ?? "user";

      return {
        success: true,
        data: {
          id: session.user.id,
          // Highlight: Include firstName, lastName, and displayName from session.user
          firstName: session.user.firstName || "",
          lastName: session.user.lastName || "",
          displayName: session.user.displayName || "", // Use displayName
          name: session.user.name || "", // Keep for backward compatibility if needed

          email: session.user.email || profile?.email || "",
          image: profile?.image ?? session.user.image ?? null,
          role: role,
          bio: session.user.bio || "" // Ensure bio is also passed
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error getting current user";

      return { success: false, error: message };
    }
  }

  // Get user role
  static async getUserRole(userId: string): Promise<UserRole> {
    "use server";
    try {
      const profile = await getUserProfile(userId);
      return (profile?.role as UserRole) || "user";
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error getting user role";

      log.error("get user role failed", message, { userId });
      return "user"; // fallback default
    }
  }

  // Additional methods would go here...
}

const mapProfileToUser = (profile: UserProfile): User => {
  return {
    id: profile.id,
    name: profile.name ?? undefined,
    displayName: profile.name ?? undefined,
    email: profile.email ?? undefined,
    image: profile.image ?? undefined,
    role: profile.role,
    createdAt: profile.createdAtISO,
    updatedAt: profile.updatedAtISO,
  };
};
