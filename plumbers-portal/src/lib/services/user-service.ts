// src/lib/services/user-service.ts
import * as UserActions from "./user/actions";
import * as UserAuth from "./user/auth";
import * as UserFavorites from "./user/favorites";
import * as UserQuotes from "./user/quotes";
import * as UserSearch from "./user/search";
import * as UserTokens from "./user/tokens";
import { config } from "@/lib/config/app-mode";
import { getFirebaseAdminAuth, UsersCollection } from "@/lib/firebase/admin";
import { storageService } from "@/lib/services/storage-service";
import type { User } from "@/lib/types/user";
import type Stripe from "stripe";

function paginate<T>(items: T[], page: number = 1, limit: number = 10): { paginatedItems: T[]; total: number } {
  const total = items.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedItems = items.slice(start, end);
  return { paginatedItems, total };
}

let stripeClientPromise: Promise<Stripe | null> | null = null;

async function getStripeClient(): Promise<Stripe | null> {
  if (stripeClientPromise) {
    return stripeClientPromise;
  }

  stripeClientPromise = (async () => {
    try {
      const stripeModule = await import("@/lib/stripe/server");
      return stripeModule.stripe;
    } catch (error) {
      console.warn("UserService: Stripe client unavailable:", error);
      return null;
    }
  })();

  return stripeClientPromise;
}

class UserService {
  // Core user methods
  findOrCreateUser = UserActions.findOrCreateUser;
  createUser = UserActions.createUser;
  updateUser = UserActions.updateUser;
  promoteToAdmin = UserActions.promoteToAdmin;
  deleteUser = UserActions.deleteUser;
  getUserById = UserActions.getUserById;
  getUserByEmail = UserActions.getUserByEmail;
  getUserBySlug = UserActions.getUserBySlug;
  getPaginatedUsers = UserActions.getPaginatedUsers;
  getAllUsers = UserActions.getAllUsers;
  getTotalUserCount = UserActions.getTotalUserCount;
  verifyUserEmail = UserActions.verifyUserEmail;

  // Auth methods
  validateCredentials = UserAuth.validateCredentials;
  updateUserPassword = UserAuth.updateUserPassword;

  // Favorites
  addFavoriteTradesperson = UserFavorites.addFavoriteTradesperson;
  removeFavoriteTradesperson = UserFavorites.removeFavoriteTradesperson;
  getFavoriteTradespeople = UserFavorites.getFavoriteTradespeople;

  // Quote limits
  canUserSubmitQuote = UserQuotes.canUserSubmitQuote;
  incrementQuoteCount = UserQuotes.incrementQuoteCount;
  resetMonthlyQuotes = UserQuotes.resetMonthlyQuotes;

  // Search
  getActiveTradespeople = UserSearch.getActiveTradespeople;
  getFeaturedTradespeople = UserSearch.getFeaturedTradespeople;

  async searchTradespeople(params: {
    query: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }> {
    const allUsers = await UserSearch.searchTradespeople(params.query);
    const { paginatedItems, total } = paginate(allUsers, params.page, params.limit);
    return { users: paginatedItems, total };
  }

  async findTradespeopleByCity(params: {
    citySlug: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }> {
    const allUsers = await UserSearch.findTradespeopleByCity(params.citySlug);
    const { paginatedItems, total } = paginate(allUsers, params.page, params.limit);
    return { users: paginatedItems, total };
  }

  async findTradespeopleByCityAndService(params: {
    citySlug: string;
    serviceSlug: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }> {
    const allUsers = await UserSearch.findTradespeopleByCityAndService(params.citySlug, params.serviceSlug);
    const { paginatedItems, total } = paginate(allUsers, params.page, params.limit);
    return { users: paginatedItems, total };
  }

  // Tokens
  storeVerificationToken = UserTokens.storeVerificationToken;
  storePasswordResetToken = UserTokens.storePasswordResetToken;
  verifyAndConsumeToken = UserTokens.verifyAndConsumeToken;
  verifyTokenWithoutConsuming = UserTokens.verifyTokenWithoutConsuming;

  async deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!userId) {
      return { success: false, error: "User ID is required." };
    }

    if (config.isMockMode) {
      return { success: true };
    }

    try {
      const user = await this.getUserById(userId);

      if (!user) {
        return { success: false, error: "User not found." };
      }

      if (user.stripeCustomerId) {
        try {
          const stripe = await getStripeClient();
          if (stripe) {
            await stripe.customers.del(user.stripeCustomerId);
          }
        } catch (error) {
          const err = error as { statusCode?: number; code?: string };
          if (err?.code === "resource_missing" || err?.statusCode === 404) {
            console.warn(`UserService: Stripe customer ${user.stripeCustomerId} already removed.`);
          } else {
            console.error("UserService: Failed to delete Stripe customer:", error);
            return {
              success: false,
              error: "Unable to delete Stripe customer record."
            };
          }
        }
      }

      try {
        await storageService.deleteFolder(`users/${userId}/`);
      } catch (error) {
        console.error("UserService: Failed to delete storage folder:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to delete user files."
        };
      }

      const usersCollection = UsersCollection();
      await usersCollection.doc(userId).delete();

      const auth = getFirebaseAdminAuth();
      await auth.deleteUser(userId);

      return { success: true };
    } catch (error) {
      console.error("UserService: deleteUserAccount error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete user account."
      };
    }
  }
}

// This factory pattern prevents stale instances during development hot-reloading.
class UserServiceFactory {
  private static instance: UserService | null = null;

  static getInstance(): UserService {
    if (config.isMockMode) {
      // In mock mode, we always want a fresh instance for tests
      return new UserService();
    }
    if (!UserServiceFactory.instance) {
      UserServiceFactory.instance = new UserService();
    }
    return UserServiceFactory.instance;
  }
}

export const userService = UserServiceFactory.getInstance();
