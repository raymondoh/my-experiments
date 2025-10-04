import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, signInWithCustomToken } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { env, isBuildTime } from "@/lib/env";
import { getURL } from "@/lib/utils"; // <-- Import the getURL utility

// Singleton references
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;

// Firebase config
function getFirebaseConfig() {
  if (isBuildTime) {
    // Minimal placeholder for build-time
    return {
      apiKey: "build-placeholder",
      authDomain: "build-placeholder",
      projectId: "build-placeholder"
    };
  }

  const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";

  return {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId,
    storageBucket:
      env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      "plumbers-portal.firebasestorage.app",
    messagingSenderId:
      env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };
}

// Initialize Firebase (singleton)
function initFirebase() {
  if (isBuildTime) {
    console.log("Skipping Firebase client initialization during build");
    return { app: null, auth: null, db: null, storage: null };
  }

  if (!firebaseApp) {
    firebaseApp = getApps().length ? getApps()[0] : initializeApp(getFirebaseConfig());
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    firebaseStorage = getStorage(firebaseApp);
  }

  return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb, storage: firebaseStorage };
}

// Export instances (lazy init)
export const getFirebaseApp = () => {
  if (!firebaseApp) initFirebase();
  return firebaseApp;
};

export const getFirebaseAuth = () => {
  if (!firebaseAuth) initFirebase();
  return firebaseAuth;
};

export const getFirebaseDb = () => {
  if (!firebaseDb) initFirebase();
  return firebaseDb;
};

export const getFirebaseStorage = () => {
  if (!firebaseStorage) initFirebase();
  return firebaseStorage;
};

// Ensure Firebase is signed in with a custom token from our NextAuth session
export const ensureFirebaseAuth = async () => {
  if (isBuildTime) return null;
  const authInstance = getFirebaseAuth();
  if (!authInstance) return null;

  if (authInstance.currentUser) return authInstance.currentUser;

  try {
    // --- THIS IS THE FIX ---
    // Construct an absolute URL for the fetch call
    const tokenUrl = getURL("/api/firebase/token");
    const res = await fetch(tokenUrl);
    // --- END OF FIX ---
    if (!res.ok) throw new Error("Failed to fetch Firebase token");
    const { token } = await res.json();
    await signInWithCustomToken(authInstance, token);
    return authInstance.currentUser;
  } catch (error) {
    console.error("Firebase sign-in failed:", error);
    return null;
  }
};
