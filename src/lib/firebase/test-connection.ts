// src/lib/firebase/test-connection.ts
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin"; // Use accessors
import { config } from "@/lib/config/app-mode";

export async function testFirebaseConnection() {
  console.log("🔥 Testing Firebase Connection...");
  console.log(`🔥 App Mode: ${config.mode}`);

  if (config.isMockMode) {
    console.log("✅ Mock mode - Firebase not needed");
    return { success: true, mode: "mock" };
  }

  const results = {
    adminAuth: false,
    adminDb: false,
    errors: [] as string[]
  };

  // Test Admin SDK
  try {
    // UPDATED: Use the imported instances directly
    const auth = getFirebaseAdminAuth();
    if (auth) {
      // Test admin auth by listing users (limit 1)
      await auth.listUsers(1);
      results.adminAuth = true;
      console.log("✅ Firebase Admin Auth connected");
    } else {
      results.errors.push("Firebase Admin Auth not initialized");
    }

    const db = getFirebaseAdminDb();
    if (db) {
      // Test admin db by getting a collection reference
      db.collection("test");
      results.adminDb = true;
      console.log("✅ Firebase Admin Firestore connected");
    } else {
      results.errors.push("Firebase Admin Firestore not initialized");
    }
  } catch (error) {
    results.errors.push(`Admin SDK Error: ${(error as Error).message}`);
    console.error("❌ Firebase Admin SDK Error:", error);
  }

  const success = results.adminAuth && results.adminDb;
  console.log(`🔥 Firebase Connection Test: ${success ? "✅ SUCCESS" : "❌ FAILED"}`);

  if (results.errors.length > 0) {
    console.log("🔥 Errors found:");
    results.errors.forEach(error => console.log(`   - ${error}`));
  }

  return {
    success,
    mode: "firebase",
    results
  };
}
