import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore, FieldValue, FieldPath } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

import { serverEnv } from "@/lib/env";

let adminApp: App | null = null;
let firestoreInstance: Firestore | null = null;
let storageInstance: Storage | null = null;
let firestoreInitializedWithEmulator = false;

const createFirebaseApp = (): App => {
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0]!;
    return adminApp;
  }

  const serviceAccount: ServiceAccount = {
    projectId: serverEnv.FIREBASE_PROJECT_ID,
    clientEmail: serverEnv.FIREBASE_CLIENT_EMAIL,
    privateKey: serverEnv.FIREBASE_PRIVATE_KEY,
  };

  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: serverEnv.FIREBASE_PROJECT_ID,
    storageBucket: serverEnv.FIREBASE_STORAGE_BUCKET,
  });

  return adminApp;
};

export const getFirebaseAdminApp = (): App => {
  return createFirebaseApp();
};

export const getAdminFirestore = (): Firestore => {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  const app = createFirebaseApp();
  firestoreInstance = getFirestore(app);

  if (!firestoreInitializedWithEmulator) {
    const emulatorHost =
      process.env.FIRESTORE_EMULATOR_HOST ??
      process.env.FIREBASE_FIRESTORE_EMULATOR_HOST ??
      process.env.FIREBASE_EMULATOR_HOST;

    if (emulatorHost) {
      firestoreInstance.settings({
        host: emulatorHost,
        ssl: false,
      });
    }

    firestoreInitializedWithEmulator = true;
  }

  return firestoreInstance;
};

export const getAdminStorage = (): Storage => {
  if (storageInstance) {
    return storageInstance;
  }

  const storageEmulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? process.env.STORAGE_EMULATOR_HOST;
  if (storageEmulatorHost && !process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = storageEmulatorHost;
  }

  const app = createFirebaseApp();
  storageInstance = getStorage(app);

  return storageInstance;
};

export { FieldValue, FieldPath };
