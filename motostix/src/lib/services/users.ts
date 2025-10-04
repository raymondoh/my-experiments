import type {
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase-admin/firestore";

import { FieldPath, FieldValue, getAdminFirestore } from "@/lib/firebase/server";
import { createLogger } from "@/lib/logger";
import { getProductById, type Product } from "@/lib/services/products";
import { getUserImage } from "@/utils/get-user-image";

export type UserId = string;

export interface UserProfile {
  id: UserId;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAtISO: string;
  updatedAtISO?: string;
  role?: "user" | "admin";
  lastLoginAtISO?: string;
}

export interface ListUsersParams {
  q?: string;
  limit?: number;
  cursor?: string | null;
  role?: "user" | "admin" | "any";
}

export interface ListUsersResult {
  items: UserProfile[];
  nextCursor: string | null;
}

export type ProductId = string;

export interface LikeRecord {
  userId: UserId;
  productId: ProductId;
  createdAtISO: string;
}

const log = createLogger("services.users");

const USERS_COLLECTION = () => getAdminFirestore().collection("users");
const likesCollection = (userId: UserId) => USERS_COLLECTION().doc(userId).collection("likes");

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000;

const profileCache = new Map<UserId, CacheEntry<UserProfile | null>>();
const likedIdsCache = new Map<UserId, CacheEntry<ProductId[]>>();

const now = () => Date.now();

const getCachedValue = <T>(map: Map<UserId, CacheEntry<T>>, key: UserId): T | undefined => {
  const entry = map.get(key);
  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt <= now()) {
    map.delete(key);
    return undefined;
  }

  return entry.value;
};

const setCachedValue = <T>(map: Map<UserId, CacheEntry<T>>, key: UserId, value: T): void => {
  map.set(key, { value, expiresAt: now() + CACHE_TTL_MS });
};

const invalidateProfileCache = (userId: UserId): void => {
  profileCache.delete(userId);
};

const invalidateLikedIdsCache = (userId: UserId): void => {
  likedIdsCache.delete(userId);
};

const toISO = (value: Timestamp | Date | string | null | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  try {
    return value.toDate().toISOString();
  } catch (error) {
    log.warn("toISO conversion failed", { reason: "timestamp", error });
    return undefined;
  }
};

const resolveName = (data: Record<string, unknown>): string | null => {
  const values = [data.name, data.displayName, data.fullName, data.username];

  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  const firstName = typeof data.firstName === "string" ? data.firstName : undefined;
  const lastName = typeof data.lastName === "string" ? data.lastName : undefined;

  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(" ") || null;
  }

  return null;
};

const toUserProfile = (
  doc: DocumentSnapshot<Record<string, unknown>>,
): UserProfile | null => {
  if (!doc.exists) {
    return null;
  }

  const data = doc.data() ?? {};
  const createdAtSource =
    data.createdAt ??
    data.created_at ??
    data.createdAtISO ??
    doc.createTime?.toDate() ??
    new Date();
  const updatedAtSource =
    data.updatedAt ??
    data.updated_at ??
    data.updatedAtISO ??
    doc.updateTime?.toDate();

  const createdAtISO = toISO(createdAtSource) ?? new Date().toISOString();
  const updatedAtISO = toISO(updatedAtSource);
  const lastLoginAtISO = toISO(
    data.lastLoginAt ??
      data.lastLoginAtISO ??
      data.lastLogin ??
      data.lastSignInAt ??
      data.lastSignInAtISO ??
      data.lastSeenAt ??
      data.lastSeenAtISO,
  );

  const email = typeof data.email === "string" ? data.email : null;
  const image = getUserImage(data) ?? null;

  let role: "user" | "admin" | undefined;
  if (data.role === "admin" || data.role === "user") {
    role = data.role;
  }

  return {
    id: doc.id,
    name: resolveName(data),
    email,
    image,
    createdAtISO,
    updatedAtISO,
    role,
    lastLoginAtISO,
  };
};

const dedupeAndSortDocs = (
  docs: QueryDocumentSnapshot<Record<string, unknown>>[],
  extra: QueryDocumentSnapshot<Record<string, unknown>>[],
  roleFilter?: "user" | "admin",
) => {
  const merged = new Map<string, QueryDocumentSnapshot<Record<string, unknown>>>();

  for (const doc of [...docs, ...extra]) {
    if (roleFilter) {
      const roleValue = doc.get("role");
      if (roleValue !== roleFilter) {
        continue;
      }
    }
    merged.set(doc.id, doc);
  }

  const entries = Array.from(merged.values());
  entries.sort((a, b) => {
    const aCreated = toISO(a.get("createdAt") ?? a.createTime?.toDate());
    const bCreated = toISO(b.get("createdAt") ?? b.createTime?.toDate());

    const aTime = aCreated ? new Date(aCreated).getTime() : 0;
    const bTime = bCreated ? new Date(bCreated).getTime() : 0;

    if (aTime === bTime) {
      return a.id.localeCompare(b.id);
    }

    return bTime - aTime;
  });

  return entries;
};

export const getUserProfile = async (userId: UserId): Promise<UserProfile | null> => {
  const cached = getCachedValue(profileCache, userId);
  if (cached !== undefined) {
    return cached;
  }

  const snapshot = await USERS_COLLECTION().doc(userId).get();
  const profile = toUserProfile(snapshot);
  setCachedValue(profileCache, userId, profile);
  return profile;
};

export const upsertUserProfile = async (
  userId: UserId,
  patch: Partial<UserProfile>,
): Promise<void> => {
  const docRef = USERS_COLLECTION().doc(userId);
  const snapshot = await docRef.get();

  const serverNow = FieldValue.serverTimestamp();
  const isoNow = new Date().toISOString();

  const updates: Record<string, unknown> = {
    updatedAt: serverNow,
    updatedAtISO: patch.updatedAtISO ?? isoNow,
  };

  if (patch.name !== undefined) {
    updates.name = patch.name;
    updates.displayName = patch.name;
    updates.nameLower = typeof patch.name === "string" ? patch.name.toLowerCase() : null;
  }

  if (patch.email !== undefined) {
    updates.email = patch.email;
    updates.emailLower = typeof patch.email === "string" ? patch.email.toLowerCase() : null;
  }

  if (patch.image !== undefined) {
    updates.image = patch.image;
  }

  if (patch.role !== undefined) {
    updates.role = patch.role;
  }

  if (patch.createdAtISO !== undefined) {
    updates.createdAtISO = patch.createdAtISO;
  }

  if (!snapshot.exists) {
    updates.createdAt = serverNow;
    updates.createdAtISO = patch.createdAtISO ?? isoNow;
  }

  await docRef.set(updates, { merge: true });
  invalidateProfileCache(userId);
};

export const listUsers = async (params: ListUsersParams = {}): Promise<ListUsersResult> => {
  const limit = Math.min(Math.max(params.limit ?? 24, 1), 48);
  const roleFilter = params.role && params.role !== "any" ? params.role : undefined;
  const normalizedQuery = params.q?.trim().toLowerCase();

  if (normalizedQuery) {
    const fetchLimit = limit + 24;
    const emailSnapshot = await USERS_COLLECTION()
      .orderBy("emailLower")
      .startAt(normalizedQuery)
      .endAt(`${normalizedQuery}\uf8ff`)
      .limit(fetchLimit)
      .get()
      .catch(error => {
        log.warn("listUsers email search fallback", {
          message: error instanceof Error ? error.message : String(error),
        });
        return null;
      });

    const nameSnapshot = await USERS_COLLECTION()
      .orderBy("nameLower")
      .startAt(normalizedQuery)
      .endAt(`${normalizedQuery}\uf8ff`)
      .limit(fetchLimit)
      .get()
      .catch(error => {
        log.warn("listUsers name search fallback", {
          message: error instanceof Error ? error.message : String(error),
        });
        return null;
      });

    const combined = dedupeAndSortDocs(
      emailSnapshot?.docs ?? [],
      nameSnapshot?.docs ?? [],
      roleFilter,
    );

    let startIndex = 0;
    if (params.cursor) {
      const cursorIndex = combined.findIndex(doc => doc.id === params.cursor);
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1;
      }
    }

    const slice = combined.slice(startIndex, startIndex + limit);
    const nextCursor =
      combined.length > startIndex + limit ? combined[startIndex + limit]?.id ?? null : null;

    return {
      items: slice
        .map(doc => toUserProfile(doc))
        .filter((profile): profile is UserProfile => profile !== null),
      nextCursor,
    };
  }

  let query = USERS_COLLECTION()
    .orderBy("createdAt", "desc")
    .orderBy(FieldPath.documentId(), "asc");

  if (roleFilter) {
    query = query.where("role", "==", roleFilter);
  }

  if (params.cursor) {
    const cursorSnapshot = await USERS_COLLECTION().doc(params.cursor).get();
    if (cursorSnapshot.exists) {
      query = query.startAfter(cursorSnapshot);
    }
  }

  const snapshot = await query.limit(limit + 1).get();
  const docs = snapshot.docs.slice(0, limit);

  const items = docs
    .map(doc => toUserProfile(doc))
    .filter((profile): profile is UserProfile => profile !== null);

  const nextCursor = snapshot.docs.length > limit ? snapshot.docs[limit]?.id ?? null : null;

  return { items, nextCursor };
};

export const getLikedProductIds = async (userId: UserId): Promise<ProductId[]> => {
  const cached = getCachedValue(likedIdsCache, userId);
  if (cached !== undefined) {
    return cached;
  }

  let snapshot;
  try {
    snapshot = await likesCollection(userId)
      .orderBy("createdAt", "desc")
      .orderBy(FieldPath.documentId(), "asc")
      .get();
  } catch (error) {
    log.warn("liked ids query fallback", {
      message: error instanceof Error ? error.message : String(error),
    });
    snapshot = await likesCollection(userId).get();
  }

  const ids = snapshot.docs.map(doc => doc.id);
  setCachedValue(likedIdsCache, userId, ids);
  return ids;
};

export const likeProduct = async (userId: UserId, productId: ProductId): Promise<void> => {
  const ref = likesCollection(userId).doc(productId);
  await ref.set(
    {
      productId,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  invalidateLikedIdsCache(userId);
};

export const unlikeProduct = async (userId: UserId, productId: ProductId): Promise<void> => {
  const ref = likesCollection(userId).doc(productId);
  await ref.delete();
  invalidateLikedIdsCache(userId);
};

export const getLikedProducts = async (
  userId: UserId,
  opts: { limit?: number; cursor?: string | null } = {},
): Promise<{ items: Product[]; nextCursor: string | null }> => {
  const limit = Math.min(Math.max(opts.limit ?? 24, 1), 48);

  let query = likesCollection(userId)
    .orderBy("createdAt", "desc")
    .orderBy(FieldPath.documentId(), "asc");

  if (opts.cursor) {
    const cursorSnapshot = await likesCollection(userId).doc(opts.cursor).get();
    if (cursorSnapshot.exists) {
      query = query.startAfter(cursorSnapshot);
    }
  }

  let snapshot;
  try {
    snapshot = await query.limit(limit + 1).get();
  } catch (error) {
    log.warn("liked products query fallback", {
      message: error instanceof Error ? error.message : String(error),
    });
    snapshot = await likesCollection(userId).limit(limit + 1).get();
  }
  const docs = snapshot.docs.slice(0, limit);

  const products = await Promise.all(
    docs.map(async doc => {
      const product = await getProductById(doc.id as ProductId);
      if (!product) {
        log.warn("liked product missing", { userId, productId: doc.id });
      }
      return product;
    }),
  );

  const items = products.filter((product): product is Product => Boolean(product));
  const nextCursor = snapshot.docs.length > limit ? snapshot.docs[limit]?.id ?? null : null;

  return { items, nextCursor };
};
