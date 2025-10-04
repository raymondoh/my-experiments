// src/lib/config/app-mode.ts
import { env } from "@/lib/env";

type AppMode = "mock" | "firebase" | "hybrid";

let _cachedAppMode: AppMode | null = null;

/**
 * Detects the application mode based on environment variables and preferences.
 * Memoized so it only runs once per process.
 */
export function getAppMode(): AppMode {
  if (_cachedAppMode) return _cachedAppMode;

  // Only log in development to avoid build spam
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) console.log("🔧 getAppMode: Starting mode detection");

  // Explicit environment preference
  const preferredMode = process.env.NEXT_PUBLIC_APP_MODE as AppMode;
  if (isDev) console.log(`🔧 NEXT_PUBLIC_APP_MODE: ${preferredMode}`);

  // Check Firebase environment variables
  const firebaseEnvVars = {
    apiKey: !!env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: !!env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: !!env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    serverProjectId: !!env.AUTH_FIREBASE_PROJECT_ID,
    clientEmail: !!env.AUTH_FIREBASE_CLIENT_EMAIL,
    privateKey: !!env.AUTH_FIREBASE_PRIVATE_KEY
  };
  if (isDev) console.log("🔧 Firebase env vars:", firebaseEnvVars);

  const missingVars = Object.entries(firebaseEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  const hasFirebaseConfig = Object.values(firebaseEnvVars).every(Boolean);

  // Determine final mode
  if (preferredMode === "mock") _cachedAppMode = "mock";
  else if (preferredMode === "firebase") {
    _cachedAppMode = hasFirebaseConfig ? "firebase" : "mock";
    if (!hasFirebaseConfig && isDev) {
      console.log(`🔧 Firebase mode requested but missing vars: ${missingVars.join(", ")}`);
    }
  } else if (preferredMode === "hybrid") _cachedAppMode = "hybrid";
  else _cachedAppMode = hasFirebaseConfig ? "firebase" : "mock";

  if (isDev) console.log(`🔧 Final app mode: ${_cachedAppMode}`);

  return _cachedAppMode;
}

// Export a single, memoized mode for easy access
export const APP_MODE = getAppMode();

// Convenience config object
export const config = {
  mode: APP_MODE,
  isFirebaseMode: APP_MODE === "firebase",
  isMockMode: APP_MODE === "mock",
  isHybridMode: APP_MODE === "hybrid"
};
