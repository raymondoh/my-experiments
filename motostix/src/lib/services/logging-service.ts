"use server";

import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { Timestamp } from "firebase-admin/firestore";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { createLogger } from "@/lib/logger";

export type LogLevel =
  | "info"
  | "warn"
  | "error"
  | "debug"
  | `auth:${string}`
  | `admin:${string}`
  | `deletion:${string}`
  | `data-privacy:${string}`
  | `order:${string}`
  | `stripe:${string}`;

export interface LogEntry<T extends Record<string, unknown> = Record<string, unknown>> {
  type: LogLevel;
  message: string;
  userId?: string;
  metadata?: T;
  context?: string; // e.g., "auth", "products"
}

// Firestore logger: logs to Firestore + console
export async function logServerEvent({
  type,
  message,
  userId,
  metadata = {},
  context = "general"
}: LogEntry): Promise<void> {
  const fallbackLogger = createLogger("services.logging");
  try {
    const db = getAdminFirestore();
    const log = {
      type,
      message,
      context,
      userId: userId || null,
      metadata,
      timestamp: Timestamp.now() // Use Firestore Timestamp for server logs
    };

    await db.collection("serverLogs").add(log);

    // Also log to console for development/debugging
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${type.toUpperCase()}] [${context}] ${message}`;
    const hasMetadata = metadata && Object.keys(metadata).length > 0;

    const logContext = hasMetadata ? { metadata } : undefined;
    switch (true) {
      case type === "error":
        fallbackLogger.error(formattedMessage, undefined, logContext);
        break;
      case type === "warn":
        fallbackLogger.warn(formattedMessage, logContext);
        break;
      case type === "debug":
        fallbackLogger.debug(formattedMessage, logContext);
        break;
      default:
        fallbackLogger.info(formattedMessage, logContext);
        break;
    }
  } catch (error) {
    const errorMessage = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error occurred while logging to Firestore";

    const errorLogger = createLogger("services.logging.error");
    errorLogger.error("write to firestore failed", errorMessage);
    errorLogger.error("log payload", undefined, { type, message, context, userId, metadata });
  }
}
