// src/lib/firebase/admin.ts
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore, type CollectionReference } from "firebase-admin/firestore";
import { env } from "@/lib/env";

// ---------- Service account config ----------
const serviceAccount = {
  projectId: env.AUTH_FIREBASE_PROJECT_ID,
  clientEmail: env.AUTH_FIREBASE_CLIENT_EMAIL,
  privateKey: env.AUTH_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
};

// ---------- Lazy App Initialization ----------
let _app: App | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _initializedLog = false;

const getFirebaseAdminApp = (): App => {
  if (!_app) {
    const existingApp = getApps()[0];
    _app = existingApp || initializeApp({ credential: cert(serviceAccount) });

    // Log only once
    if (!_initializedLog) {
      console.log("🔥 Firebase Admin SDK Initialized");
      _initializedLog = true;
    }
  }
  return _app;
};

// ---------- Lazy Auth and Firestore ----------
export const getFirebaseAdminAuth = (): Auth => {
  if (!_auth) _auth = getAuth(getFirebaseAdminApp());
  return _auth;
};

export const getFirebaseAdminDb = (): Firestore => {
  if (!_db) _db = getFirestore(getFirebaseAdminApp());
  return _db;
};

// ---------- Collection constants ----------
export const COLLECTIONS = {
  USERS: "users",
  ACTIVITY_LOGS: "activity_logs",
  SESSIONS: "sessions",
  JOBS: "jobs",
  NOTIFICATIONS: "notifications",
  SAVED_JOBS: "savedJobs",
  REVIEWS: "reviews",
  CHATS: "chats",
  VERIFICATION_TOKENS: "verificationTokens",
  PASSWORD_RESET_TOKENS: "passwordResetTokens",
  SERVICES: "services",
  BUSINESS_TEAMS: "businessTeams",
  BUSINESS_INVENTORY: "businessInventory",
  BUSINESS_CUSTOMERS: "businessCustomers"
} as const;

// ---------- Typed collection getter ----------
export const getAdminCollection = <T = unknown>(
  name: keyof typeof COLLECTIONS | (typeof COLLECTIONS)[keyof typeof COLLECTIONS]
): CollectionReference<T> => {
  const collectionName =
    typeof name === "string" && name in COLLECTIONS ? COLLECTIONS[name as keyof typeof COLLECTIONS] : name;
  if (typeof collectionName !== "string" || collectionName.length === 0) {
    throw new Error(`Invalid collection name: ${String(name)}`);
  }
  return getFirebaseAdminDb().collection(collectionName) as CollectionReference<T>;
};

// ---------- Convenience accessors ----------
export const UsersCollection = () => getAdminCollection("USERS");
export const ActivityLogsCollection = () => getAdminCollection("ACTIVITY_LOGS");
export const SessionsCollection = () => getAdminCollection("SESSIONS");
export const JobsCollection = () => getAdminCollection("JOBS");
export const NotificationsCollection = () => getAdminCollection("NOTIFICATIONS");
export const SavedJobsCollection = () => getAdminCollection("SAVED_JOBS");
export const ReviewsCollection = () => getAdminCollection("REVIEWS");
export const ChatsCollection = () => getAdminCollection("CHATS");
export const ServicesCollection = () => getAdminCollection("SERVICES");
export const BusinessTeamsCollection = () => getAdminCollection("BUSINESS_TEAMS");
export const BusinessInventoryCollection = () => getAdminCollection("BUSINESS_INVENTORY");
export const BusinessCustomersCollection = () => getAdminCollection("BUSINESS_CUSTOMERS");

// ---------- Exports ----------
export { getFirebaseAdminApp };
