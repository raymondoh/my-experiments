// // src/lib/services/user/actions.ts
// "use server";

// // src/lib/services/user/actions.ts
// import { getFirebaseAdminAuth, UsersCollection, COLLECTIONS } from "@/lib/firebase/admin";
// import { FieldPath } from "firebase-admin/firestore";
// import { toUniqueSlug } from "@/lib/utils";
// import type { User, UpdateUserData } from "@/lib/types/user";
// import type { UserRole } from "@/lib/auth/roles";
// import type { Certification } from "@/lib/types/certification";
// import { geocodingService } from "@/lib/services/geocoding-service";
// import { generateKeywords } from "./utils";
// import { mapToUser } from "./utils";
// import type { Job } from "@/lib/types/job";
// import bcrypt from "bcryptjs";

// export async function findOrCreateUser(data: {
//   email: string;
//   name: string;
//   profilePicture?: string | null;
//   authProvider?: string;
//   role: UserRole;
// }): Promise<User | null> {
//   try {
//     const existingUser = await getUserByEmail(data.email);
//     if (existingUser) {
//       return existingUser;
//     }

//     const adminAuth = getFirebaseAdminAuth();
//     const userRecord = await adminAuth.createUser({
//       email: data.email,
//       displayName: data.name,
//       photoURL: data.profilePicture || undefined,
//       emailVerified: true
//     });

//     const userData: Omit<User, "id"> = {
//       email: data.email.toLowerCase(),
//       name: data.name,
//       profilePicture: data.profilePicture || null,
//       role: data.role,
//       emailVerified: new Date(),
//       onboardingComplete: false,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       favoriteTradespeople: [],
//       subscriptionTier: "basic",
//       subscriptionStatus: null,
//       status: "active"
//     };

//     await UsersCollection().doc(userRecord.uid).set(userData);
//     return mapToUser(userRecord.uid, userData as Record<string, unknown>);
//   } catch (error) {
//     console.error("!!! ERROR in findOrCreateUser:", error);
//     return null;
//   }
// }

// function serializeUserForClient(user: User): User {
//   const isDateLike = (value: unknown): value is { toDate: () => Date } =>
//     typeof value === "object" &&
//     value !== null &&
//     "toDate" in value &&
//     typeof (value as { toDate: unknown }).toDate === "function";

//   const serializedUser: User = JSON.parse(JSON.stringify(user));
//   const originalUser = user as unknown as Record<string, unknown>;
//   const serializedRecord = serializedUser as unknown as Record<string, unknown>;

//   for (const key in serializedRecord) {
//     const value = originalUser[key];
//     if (isDateLike(value)) {
//       serializedRecord[key] = value.toDate().toISOString();
//     }
//   }

//   if (user.certifications) {
//     serializedUser.certifications = user.certifications.map((cert: Certification) => {
//       const serializedCert: Record<string, unknown> = { ...cert };
//       const certRecord = cert as unknown as Record<string, unknown>;
//       for (const certKey in serializedCert) {
//         const certValue = certRecord[certKey];
//         if (isDateLike(certValue)) {
//           serializedCert[certKey] = certValue.toDate().toISOString();
//         }
//       }
//       return serializedCert as unknown as Certification;
//     });
//   }

//   if (isDateLike(user.emailVerified)) {
//     (serializedUser.emailVerified as unknown) = true;
//   } else {
//     (serializedUser.emailVerified as unknown) = !!user.emailVerified;
//   }

//   return serializedUser;
// }

// export async function createUser(email: string, password: string, name: string, role: UserRole): Promise<User> {
//   const existingUser = await getUserByEmail(email);
//   if (existingUser) throw new Error("User already exists");

//   const usersCollection = UsersCollection();
//   const usersSnapshot = await usersCollection.limit(1).get();
//   const isFirstUser = usersSnapshot.empty;
//   const assignedRole: UserRole = isFirstUser ? "admin" : role || "customer";

//   const adminAuth = getFirebaseAdminAuth();
//   const userRecord = await adminAuth.createUser({
//     email,
//     password,
//     displayName: name,
//     emailVerified: false
//   });

//   const hashedPassword = await bcrypt.hash(password, 12);

//   let slug: string | undefined;
//   if (assignedRole === "tradesperson") {
//     slug = await toUniqueSlug(COLLECTIONS.USERS, name);
//   }

//   const userData: Omit<User, "id"> & { hashedPassword?: string | null } = {
//     email,
//     name,
//     ...(slug ? { slug } : {}),
//     hashedPassword,
//     emailVerified: null,
//     termsAcceptedAt: new Date(),
//     role: assignedRole,
//     favoriteTradespeople: [],
//     subscriptionTier: "basic",
//     stripeCustomerId: null,
//     subscriptionStatus: "active",
//     status: "active",
//     monthlyQuotesUsed: 0,
//     quoteResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     onboardingComplete: false
//   };

//   if (assignedRole === "tradesperson") {
//     userData.notificationSettings = { newJobAlerts: true };
//     userData.searchKeywords = generateKeywords(userData);
//   }

//   await usersCollection.doc(userRecord.uid).set(userData);

//   return mapToUser(userRecord.uid, userData as Record<string, unknown>);
// }

// export async function updateUser(id: string, updates: UpdateUserData): Promise<User | null> {
//   const usersCollection = UsersCollection();
//   const existingDoc = await usersCollection.doc(id).get();
//   if (!existingDoc.exists) return null;
//   const existing = (existingDoc.data() || {}) as Partial<User>;

//   const updateData: UpdateUserData & { [key: string]: unknown; updatedAt: Date } = {
//     ...updates,
//     updatedAt: new Date()
//   };

//   if (updateData.location) {
//     updateData.location = {
//       ...(existing.location ?? {}),
//       ...updateData.location
//     };
//   }

//   const currentRole = existing.role;
//   const newRole = updates.role ?? currentRole;
//   if (newRole === "tradesperson") {
//     const nameChanged =
//       (updates.businessName !== undefined && updates.businessName !== existing.businessName) ||
//       (updates.name !== undefined && updates.name !== existing.name);
//     if (nameChanged) {
//       const base = updates.businessName ?? updates.name ?? existing.businessName ?? existing.name;
//       if (base) {
//         updateData.slug = await toUniqueSlug(COLLECTIONS.USERS, base, id);
//       }
//     }
//     const fieldsThatAffectKeywords = ["businessName", "name", "specialties", "location"];
//     const keywordsNeedUpdate = fieldsThatAffectKeywords.some(field => field in updates);

//     if (keywordsNeedUpdate) {
//       const futureData = { ...existing, ...updates } as Partial<User>;
//       updateData.searchKeywords = generateKeywords(futureData);
//     }
//   }

//   if (Array.isArray(updateData.certifications)) {
//     const certArray = updateData.certifications as Certification[];
//     const certObj: Record<string, Omit<Certification, "id">> = {};
//     for (const cert of certArray) {
//       const { id: certId, ...rest } = cert;
//       certObj[certId] = rest;
//     }
//     (updateData as unknown as Record<string, unknown>).certifications = certObj;
//   }

//   const postcodeForGeocoding = updateData.location?.postcode ?? existing.location?.postcode;

//   if (
//     postcodeForGeocoding &&
//     (updateData.location?.latitude === undefined || updateData.location?.longitude === undefined)
//   ) {
//     try {
//       const geoResult = await geocodingService.getCoordinatesFromPostcode(postcodeForGeocoding);
//       // --- THIS IS THE FIX ---
//       // Ensure updateData.location exists before trying to assign to its properties.
//       if (geoResult && updateData.location) {
//         updateData.location.latitude = geoResult.coordinates.latitude;
//         updateData.location.longitude = geoResult.coordinates.longitude;
//       }
//     } catch (geoError) {
//       console.warn("UserService: Geocoding failed, continuing without coordinates:", geoError);
//     }
//   }

//   const removeUndefined = (obj: Record<string, unknown>): void => {
//     Object.keys(obj).forEach(key => {
//       const value = obj[key];
//       if (value === undefined) {
//         delete obj[key];
//       } else if (typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
//         removeUndefined(value as Record<string, unknown>);
//       }
//     });
//   };
//   removeUndefined(updateData);

//   await usersCollection.doc(id).update(updateData);
//   return getUserById(id);
// }

// export async function findMatchingTradespeople(job: Job): Promise<User[]> {
//   const usersCollection = UsersCollection();
//   const tradespeopleSnapshot = await usersCollection
//     .where("role", "==", "tradesperson")
//     .where("notificationSettings.newJobAlerts", "==", true)
//     .get();

//   if (tradespeopleSnapshot.empty) {
//     return [];
//   }

//   const jobPostcodePrefix = job.location?.postcode?.trim().split(" ")[0]?.toLowerCase();
//   const jobServiceType = job.serviceType?.trim().toLowerCase();

//   if (!jobPostcodePrefix || !jobServiceType) {
//     return [];
//   }

//   const matchingTradespeople: User[] = [];

//   tradespeopleSnapshot.forEach(doc => {
//     const tradesperson = mapToUser(doc.id, doc.data() as Record<string, unknown>);

//     const serviceAreas = (tradesperson.serviceAreas || "").toLowerCase();
//     const specialties = (tradesperson.specialties || []).map(s => s.toLowerCase());

//     const areaMatch = serviceAreas.includes(jobPostcodePrefix);
//     const specialtyMatch = specialties.includes(jobServiceType);

//     if (areaMatch && specialtyMatch) {
//       matchingTradespeople.push(tradesperson);
//     }
//   });

//   return matchingTradespeople;
// }

// export async function promoteToAdmin(id: string): Promise<User | null> {
//   return await updateUser(id, { role: "admin" });
// }

// export async function deleteUser(id: string): Promise<boolean> {
//   try {
//     const adminAuth = getFirebaseAdminAuth();
//     await adminAuth.deleteUser(id);

//     const usersCollection = UsersCollection();
//     await usersCollection.doc(id).delete();
//     return true;
//   } catch (err) {
//     console.error(`UserService: deleteUser error for ID ${id}:`, err);
//     if (typeof err === "object" && err && "code" in err && (err as { code?: string }).code === "auth/user-not-found") {
//       try {
//         const usersCollection = UsersCollection();
//         await usersCollection.doc(id).delete();
//         return true;
//       } catch (dbErr) {
//         console.error(`UserService: Firestore cleanup failed for user ${id}:`, dbErr);
//       }
//     }
//     return false;
//   }
// }

// export async function getUserById(id: string): Promise<User | null> {
//   try {
//     const usersCollection = UsersCollection();
//     const doc = await usersCollection.doc(id).get();
//     if (!doc.exists) return null;
//     return mapToUser(doc.id, doc.data()! as Record<string, unknown>);
//   } catch (err) {
//     console.error("UserService: getUserById error:", err);
//     return null;
//   }
// }

// export async function getUserByEmail(email: string): Promise<User | null> {
//   try {
//     const usersCollection = UsersCollection();
//     const query = await usersCollection.where("email", "==", email).limit(1).get();
//     if (query.empty) return null;
//     const doc = query.docs[0];
//     return mapToUser(doc.id, doc.data() as Record<string, unknown>);
//   } catch (err) {
//     console.error("UserService: getUserByEmail error:", err);
//     return null;
//   }
// }

// export async function getUserBySlug(slug: string): Promise<User | null> {
//   try {
//     const usersCollection = UsersCollection();
//     const snap = await usersCollection.where("slug", "==", slug).limit(1).get();
//     if (snap.empty) return null;
//     const doc = snap.docs[0];
//     return mapToUser(doc.id, doc.data() as Record<string, unknown>);
//   } catch (err) {
//     console.error("UserService: getUserBySlug error:", err);
//     return null;
//   }
// }

// export async function getPaginatedUsers({
//   limit = 6,
//   lastVisibleId = null
// }: {
//   limit?: number;
//   lastVisibleId?: string | null;
// }): Promise<{
//   users: User[];
//   lastVisibleId: string | null;
//   totalUserCount: number;
// }> {
//   try {
//     const usersCollection = UsersCollection();
//     let query = usersCollection.orderBy(FieldPath.documentId()).limit(limit);
//     if (lastVisibleId) {
//       const lastVisibleDoc = await usersCollection.doc(lastVisibleId).get();
//       if (lastVisibleDoc.exists) {
//         query = query.startAfter(lastVisibleDoc);
//       }
//     }

//     const [snapshot, countSnap] = await Promise.all([query.get(), usersCollection.count().get()]);

//     const users = snapshot.docs.map(doc => mapToUser(doc.id, doc.data() as Record<string, unknown>));
//     const nextCursor = snapshot.size === limit ? snapshot.docs[snapshot.docs.length - 1].id : null;

//     const serializableUsers = users.map(serializeUserForClient);

//     return {
//       users: serializableUsers,
//       lastVisibleId: nextCursor,
//       totalUserCount: countSnap.data().count
//     };
//   } catch (err) {
//     console.error("UserService: getPaginatedUsers error:", err);
//     throw new Error("Failed to fetch paginated users.");
//   }
// }

// export async function getAllUsers(): Promise<User[]> {
//   const allUsers: User[] = [];
//   let cursor: string | null = null;

//   while (true) {
//     const { users, lastVisibleId } = await getPaginatedUsers({ limit: 100, lastVisibleId: cursor });
//     allUsers.push(...users);
//     if (!lastVisibleId) break;
//     cursor = lastVisibleId;
//   }

//   return allUsers;
// }

// export async function getTotalUserCount(): Promise<number> {
//   try {
//     const usersCollection = UsersCollection();
//     const countSnap = await usersCollection.count().get();
//     return countSnap.data().count;
//   } catch (err) {
//     console.error("UserService: getTotalUserCount error:", err);
//     throw new Error("Failed to get total user count.");
//   }
// }

// export async function verifyUserEmail(email: string): Promise<boolean> {
//   try {
//     const user = await getUserByEmail(email);
//     if (!user) return false;

//     const usersCollection = UsersCollection();
//     await usersCollection.doc(user.id).update({
//       emailVerified: true,
//       updatedAt: new Date()
//     });

//     const adminAuth = getFirebaseAdminAuth();
//     await adminAuth.updateUser(user.id, { emailVerified: true });

//     return true;
//   } catch (err) {
//     console.error("UserService: verifyUserEmail error:", err);
//     return false;
//   }
// }
// src/lib/services/user/actions.ts
"use server";

// src/lib/services/user/actions.ts
import { getFirebaseAdminAuth, UsersCollection, COLLECTIONS } from "@/lib/firebase/admin";
import { FieldPath } from "firebase-admin/firestore";
import { toUniqueSlug } from "@/lib/utils";
import type { User, UpdateUserData } from "@/lib/types/user";
import type { UserRole } from "@/lib/auth/roles";
import type { Certification } from "@/lib/types/certification";
import { geocodingService } from "@/lib/services/geocoding-service";
import { generateKeywords } from "./utils";
import { mapToUser } from "./utils";
import type { Job } from "@/lib/types/job";
import bcrypt from "bcryptjs";

export async function findOrCreateUser(data: {
  email: string;
  name: string;
  profilePicture?: string | null;
  authProvider?: string;
  role: UserRole;
}): Promise<User | null> {
  try {
    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
      return existingUser;
    }

    const adminAuth = getFirebaseAdminAuth();
    const userRecord = await adminAuth.createUser({
      email: data.email,
      displayName: data.name,
      photoURL: data.profilePicture || undefined,
      emailVerified: true
    });

    const userData: Omit<User, "id"> = {
      email: data.email.toLowerCase(),
      name: data.name,
      profilePicture: data.profilePicture || null,
      role: data.role,
      emailVerified: new Date(),
      onboardingComplete: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      favoriteTradespeople: [],
      subscriptionTier: "basic",
      subscriptionStatus: null,
      status: "active"
    };

    await UsersCollection().doc(userRecord.uid).set(userData);
    return mapToUser(userRecord.uid, userData as Record<string, unknown>);
  } catch (error) {
    console.error("!!! ERROR in findOrCreateUser:", error);
    return null;
  }
}

function serializeUserForClient(user: User): User {
  const isDateLike = (value: unknown): value is { toDate: () => Date } =>
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function";

  const serializedUser: User = JSON.parse(JSON.stringify(user));
  const originalUser = user as unknown as Record<string, unknown>;
  const serializedRecord = serializedUser as unknown as Record<string, unknown>;

  for (const key in serializedRecord) {
    const value = originalUser[key];
    if (isDateLike(value)) {
      serializedRecord[key] = value.toDate().toISOString();
    }
  }

  if (user.certifications) {
    serializedUser.certifications = user.certifications.map((cert: Certification) => {
      const serializedCert: Record<string, unknown> = { ...cert };
      const certRecord = cert as unknown as Record<string, unknown>;
      for (const certKey in serializedCert) {
        const certValue = certRecord[certKey];
        if (isDateLike(certValue)) {
          serializedCert[certKey] = certValue.toDate().toISOString();
        }
      }
      return serializedCert as unknown as Certification;
    });
  }

  if (isDateLike(user.emailVerified)) {
    (serializedUser.emailVerified as unknown) = true;
  } else {
    (serializedUser.emailVerified as unknown) = !!user.emailVerified;
  }

  return serializedUser;
}

export async function createUser(email: string, password: string, name: string, role: UserRole): Promise<User> {
  const existingUser = await getUserByEmail(email);
  if (existingUser) throw new Error("User already exists");

  const usersCollection = UsersCollection();
  const usersSnapshot = await usersCollection.limit(1).get();
  const isFirstUser = usersSnapshot.empty;
  const assignedRole: UserRole = isFirstUser ? "admin" : role || "customer";

  const adminAuth = getFirebaseAdminAuth();
  const userRecord = await adminAuth.createUser({
    email,
    password,
    displayName: name,
    emailVerified: false
  });

  const hashedPassword = await bcrypt.hash(password, 12);

  let slug: string | undefined;
  if (assignedRole === "tradesperson") {
    slug = await toUniqueSlug(COLLECTIONS.USERS, name);
  }

  const userData: Omit<User, "id"> & { hashedPassword?: string | null } = {
    email,
    name,
    ...(slug ? { slug } : {}),
    hashedPassword,
    emailVerified: null,
    termsAcceptedAt: new Date(),
    role: assignedRole,
    favoriteTradespeople: [],
    subscriptionTier: "basic",
    stripeCustomerId: null,
    subscriptionStatus: "active",
    status: "active",
    monthlyQuotesUsed: 0,
    quoteResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    createdAt: new Date(),
    updatedAt: new Date(),
    onboardingComplete: false
  };

  if (assignedRole === "tradesperson") {
    userData.notificationSettings = { newJobAlerts: true };
    userData.searchKeywords = generateKeywords(userData);
  }

  await usersCollection.doc(userRecord.uid).set(userData);

  return mapToUser(userRecord.uid, userData as Record<string, unknown>);
}

export async function updateUser(id: string, updates: UpdateUserData): Promise<User | null> {
  console.log(`[userService.updateUser] Updating user ${id} with:`, updates);
  const usersCollection = UsersCollection();
  const existingDoc = await usersCollection.doc(id).get();
  if (!existingDoc.exists) {
    console.error(`[userService.updateUser] User with id ${id} not found`);
    return null;
  }
  const existing = (existingDoc.data() || {}) as Partial<User>;
  console.log(`[userService.updateUser] Existing user data for ${id}:`, existing);

  const updateData: UpdateUserData & { [key: string]: unknown; updatedAt: Date } = {
    ...updates,
    updatedAt: new Date()
  };

  if (updateData.location) {
    updateData.location = {
      ...(existing.location ?? {}),
      ...updateData.location
    };
  }

  const currentRole = existing.role;
  const newRole = updates.role ?? currentRole;
  if (newRole === "tradesperson") {
    const nameChanged =
      (updates.businessName !== undefined && updates.businessName !== existing.businessName) ||
      (updates.name !== undefined && updates.name !== existing.name);
    if (nameChanged) {
      const base = updates.businessName ?? updates.name ?? existing.businessName ?? existing.name;
      if (base) {
        updateData.slug = await toUniqueSlug(COLLECTIONS.USERS, base, id);
      }
    }
    const fieldsThatAffectKeywords = ["businessName", "name", "specialties", "location"];
    const keywordsNeedUpdate = fieldsThatAffectKeywords.some(field => field in updates);

    if (keywordsNeedUpdate) {
      const futureData = { ...existing, ...updates } as Partial<User>;
      updateData.searchKeywords = generateKeywords(futureData);
    }
  }

  if (Array.isArray(updateData.certifications)) {
    const certArray = updateData.certifications as Certification[];
    const certObj: Record<string, Omit<Certification, "id">> = {};
    for (const cert of certArray) {
      const { id: certId, ...rest } = cert;
      certObj[certId] = rest;
    }
    (updateData as unknown as Record<string, unknown>).certifications = certObj;
  }

  const postcodeForGeocoding = updateData.location?.postcode ?? existing.location?.postcode;

  if (
    postcodeForGeocoding &&
    (updateData.location?.latitude === undefined || updateData.location?.longitude === undefined)
  ) {
    try {
      console.log(`[userService.updateUser] Geocoding postcode for user ${id}:`, postcodeForGeocoding);
      const geoResult = await geocodingService.getCoordinatesFromPostcode(postcodeForGeocoding);
      // --- THIS IS THE FIX ---
      // Ensure updateData.location exists before trying to assign to its properties.
      if (geoResult && updateData.location) {
        updateData.location.latitude = geoResult.coordinates.latitude;
        updateData.location.longitude = geoResult.coordinates.longitude;
        console.log(`[userService.updateUser] Geocoding successful for user ${id}:`, geoResult.coordinates);
      } else {
        console.log(`[userService.updateUser] Geocoding failed for user ${id}`);
      }
    } catch (geoError) {
      console.warn("UserService: Geocoding failed, continuing without coordinates:", geoError);
    }
  }

  const removeUndefined = (obj: Record<string, unknown>): void => {
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value === undefined) {
        delete obj[key];
      } else if (typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
        removeUndefined(value as Record<string, unknown>);
      }
    });
  };
  removeUndefined(updateData);

  console.log(`[userService.updateUser] Final update payload for user ${id}:`, updateData);
  await usersCollection.doc(id).update(updateData);
  console.log(`[userService.updateUser] Firestore update complete for user ${id}`);
  return getUserById(id);
}

export async function findMatchingTradespeople(job: Job): Promise<User[]> {
  const usersCollection = UsersCollection();
  const tradespeopleSnapshot = await usersCollection
    .where("role", "==", "tradesperson")
    .where("notificationSettings.newJobAlerts", "==", true)
    .get();

  if (tradespeopleSnapshot.empty) {
    return [];
  }

  const jobPostcodePrefix = job.location?.postcode?.trim().split(" ")[0]?.toLowerCase();
  const jobServiceType = job.serviceType?.trim().toLowerCase();

  if (!jobPostcodePrefix || !jobServiceType) {
    return [];
  }

  const matchingTradespeople: User[] = [];

  tradespeopleSnapshot.forEach(doc => {
    const tradesperson = mapToUser(doc.id, doc.data() as Record<string, unknown>);

    const serviceAreas = (tradesperson.serviceAreas || "").toLowerCase();
    const specialties = (tradesperson.specialties || []).map(s => s.toLowerCase());

    const areaMatch = serviceAreas.includes(jobPostcodePrefix);
    const specialtyMatch = specialties.includes(jobServiceType);

    if (areaMatch && specialtyMatch) {
      matchingTradespeople.push(tradesperson);
    }
  });

  return matchingTradespeople;
}

export async function promoteToAdmin(id: string): Promise<User | null> {
  return await updateUser(id, { role: "admin" });
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const adminAuth = getFirebaseAdminAuth();
    await adminAuth.deleteUser(id);

    const usersCollection = UsersCollection();
    await usersCollection.doc(id).delete();
    return true;
  } catch (err) {
    console.error(`UserService: deleteUser error for ID ${id}:`, err);
    if (typeof err === "object" && err && "code" in err && (err as { code?: string }).code === "auth/user-not-found") {
      try {
        const usersCollection = UsersCollection();
        await usersCollection.doc(id).delete();
        return true;
      } catch (dbErr) {
        console.error(`UserService: Firestore cleanup failed for user ${id}:`, dbErr);
      }
    }
    return false;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const usersCollection = UsersCollection();
    const doc = await usersCollection.doc(id).get();
    if (!doc.exists) return null;
    return mapToUser(doc.id, doc.data()! as Record<string, unknown>);
  } catch (err) {
    console.error("UserService: getUserById error:", err);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const usersCollection = UsersCollection();
    const query = await usersCollection.where("email", "==", email).limit(1).get();
    if (query.empty) return null;
    const doc = query.docs[0];
    return mapToUser(doc.id, doc.data() as Record<string, unknown>);
  } catch (err) {
    console.error("UserService: getUserByEmail error:", err);
    return null;
  }
}

export async function getUserBySlug(slug: string): Promise<User | null> {
  try {
    const usersCollection = UsersCollection();
    const snap = await usersCollection.where("slug", "==", slug).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return mapToUser(doc.id, doc.data() as Record<string, unknown>);
  } catch (err) {
    console.error("UserService: getUserBySlug error:", err);
    return null;
  }
}

export async function getPaginatedUsers({
  limit = 6,
  lastVisibleId = null
}: {
  limit?: number;
  lastVisibleId?: string | null;
}): Promise<{
  users: User[];
  lastVisibleId: string | null;
  totalUserCount: number;
}> {
  try {
    const usersCollection = UsersCollection();
    let query = usersCollection.orderBy(FieldPath.documentId()).limit(limit);
    if (lastVisibleId) {
      const lastVisibleDoc = await usersCollection.doc(lastVisibleId).get();
      if (lastVisibleDoc.exists) {
        query = query.startAfter(lastVisibleDoc);
      }
    }

    const [snapshot, countSnap] = await Promise.all([query.get(), usersCollection.count().get()]);

    const users = snapshot.docs.map(doc => mapToUser(doc.id, doc.data() as Record<string, unknown>));
    const nextCursor = snapshot.size === limit ? snapshot.docs[snapshot.docs.length - 1].id : null;

    const serializableUsers = users.map(serializeUserForClient);

    return {
      users: serializableUsers,
      lastVisibleId: nextCursor,
      totalUserCount: countSnap.data().count
    };
  } catch (err) {
    console.error("UserService: getPaginatedUsers error:", err);
    throw new Error("Failed to fetch paginated users.");
  }
}

export async function getAllUsers(): Promise<User[]> {
  const allUsers: User[] = [];
  let cursor: string | null = null;

  while (true) {
    const { users, lastVisibleId } = await getPaginatedUsers({ limit: 100, lastVisibleId: cursor });
    allUsers.push(...users);
    if (!lastVisibleId) break;
    cursor = lastVisibleId;
  }

  return allUsers;
}

export async function getTotalUserCount(): Promise<number> {
  try {
    const usersCollection = UsersCollection();
    const countSnap = await usersCollection.count().get();
    return countSnap.data().count;
  } catch (err) {
    console.error("UserService: getTotalUserCount error:", err);
    throw new Error("Failed to get total user count.");
  }
}

export async function verifyUserEmail(email: string): Promise<boolean> {
  try {
    const user = await getUserByEmail(email);
    if (!user) return false;

    const usersCollection = UsersCollection();
    await usersCollection.doc(user.id).update({
      emailVerified: true,
      updatedAt: new Date()
    });

    const adminAuth = getFirebaseAdminAuth();
    await adminAuth.updateUser(user.id, { emailVerified: true });

    return true;
  } catch (err) {
    console.error("UserService: verifyUserEmail error:", err);
    return false;
  }
}
