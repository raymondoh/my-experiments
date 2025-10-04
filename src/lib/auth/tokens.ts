import crypto from "crypto";
import { config } from "@/lib/config/app-mode";

// Lazily import userService only when needed to avoid initializing Firebase
async function getUserService() {
  const { userService } = await import("@/lib/services/user-service");
  return userService;
}

export class TokenService {
  private generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  // --- Email Verification Tokens ---

  async createEmailVerificationToken(email: string): Promise<string> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    if (config.isMockMode) {
      console.log("🔑 Mock: Storing verification token.");
      global.mockTokens = global.mockTokens || new Map();
      global.mockTokens.set(token, { email, expiresAt });
    } else {
      const userService = await getUserService();
      await userService.storeVerificationToken(email, token, expiresAt);
    }
    return token;
  }

  async verifyAndConsumeEmailVerificationToken(
    token: string
  ): Promise<{ valid: boolean; email?: string; error?: string }> {
    if (config.isMockMode) {
      console.log("🔍 Mock: Verifying token.");
      global.mockTokens = global.mockTokens || new Map();
      const tokenData = global.mockTokens.get(token);
      if (!tokenData || tokenData.expiresAt < new Date()) {
        if (tokenData) global.mockTokens.delete(token);
        return { valid: false, error: "Invalid or expired token" };
      }
      global.mockTokens.delete(token);
      return { valid: true, email: tokenData.email };
    } else {
      const userService = await getUserService();
      const email = await userService.verifyAndConsumeToken(token, "verification");
      if (email) {
        return { valid: true, email };
      }
      return { valid: false, error: "Invalid or expired token" };
    }
  }

  // --- Password Reset Tokens ---

  async createPasswordResetToken(email: string): Promise<string> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    if (config.isMockMode) {
      console.log("🔑 Mock: Storing password reset token.");
      global.mockResetTokens = global.mockResetTokens || new Map();
      global.mockResetTokens.set(token, { email, expiresAt });
    } else {
      const userService = await getUserService();
      await userService.storePasswordResetToken(email, token, expiresAt);
    }
    return token;
  }

  async consumePasswordResetToken(token: string): Promise<string | null> {
    if (config.isMockMode) {
      console.log("🔍 Mock: Consuming password reset token.");
      global.mockResetTokens = global.mockResetTokens || new Map();
      const tokenData = global.mockResetTokens.get(token);
      if (!tokenData || tokenData.expiresAt < new Date()) {
        if (tokenData) global.mockResetTokens.delete(token);
        return null;
      }
      global.mockResetTokens.delete(token);
      return tokenData.email;
    } else {
      const userService = await getUserService();
      return await userService.verifyAndConsumeToken(token, "password_reset");
    }
  }
  async checkToken(
    token: string,
    type: "verification" | "password_reset"
  ): Promise<{ valid: boolean; email?: string; error?: string }> {
    if (config.isMockMode) {
      const mockStore = type === "verification" ? global.mockTokens : global.mockResetTokens;
      const tokenData = mockStore?.get(token);
      if (!tokenData || tokenData.expiresAt < new Date()) {
        return { valid: false, error: "Invalid or expired token" };
      }
      return { valid: true, email: tokenData.email };
    } else {
      const userService = await getUserService();
      const email = await userService.verifyTokenWithoutConsuming(token, type);
      if (email) {
        return { valid: true, email };
      }
      return { valid: false, error: "Invalid or expired token" };
    }
  }
}

export const tokenService = new TokenService();

// Define global types for mock storage
declare global {
  var mockTokens: Map<string, { email: string; expiresAt: Date }> | undefined;
  var mockResetTokens: Map<string, { email: string; expiresAt: Date }> | undefined;
}
