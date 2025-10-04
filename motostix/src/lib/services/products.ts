import type { Timestamp } from "firebase-admin/firestore";

import { FieldPath, FieldValue, getAdminFirestore } from "@/lib/firebase/server";

export type ProductId = string;

export interface Product {
  id: ProductId;
  name: string;
  slug: string;
  description?: string;
  details?: string;
  sku?: string;
  barcode?: string;
  price: number;
  onSale?: boolean;
  salePrice?: number | null;
  category: string;
  subcategory?: string;
  images: string[];
  image?: string;
  additionalImages?: string[];
  placements?: string[];
  designThemes?: string[];
  tags?: string[];
  brand?: string;
  manufacturer?: string;
  dimensions?: string;
  weight?: string;
  shippingWeight?: string;
  material?: string;
  finish?: string;
  color?: string;
  baseColor?: string;
  colorDisplayName?: string;
  stickySide?: string;
  size?: string;
  productType?: string;
  inStock?: boolean;
  costPrice?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  shippingClass?: string;
  badge?: string;
  isFeatured?: boolean;
  isHero?: boolean;
  isLiked?: boolean;
  isCustomizable?: boolean;
  isNewArrival?: boolean;
  ratingAvg?: number;
  ratingCount?: number;
  averageRating?: number;
  reviewCount?: number;
  createdAtISO: string;
  updatedAtISO?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListParams {
  q?: string;
  category?: string;
  onSale?: boolean;
  limit?: number;
  cursor?: string | null;
  sort?: "new" | "priceAsc" | "priceDesc" | "rating";
}

export interface ListResult {
  items: Product[];
  nextCursor: string | null;
}

interface CachedProduct {
  value: Product;
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000;
const productCache = new Map<ProductId, CachedProduct>();

const productsCollection = () => getAdminFirestore().collection("products");

const toISO = (value: Timestamp | Date | string | null | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  try {
    return value.toDate().toISOString();
  } catch (error) {
    console.warn("[productsService] Failed to convert timestamp to ISO", error);
    return undefined;
  }
};

const ensureArray = <T>(input: unknown, fallback: T[] = []): T[] => {
  if (Array.isArray(input)) {
    return input as T[];
  }

  if (input == null) {
    return fallback;
  }

  return fallback;
};

const coerceBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
  }

  return undefined;
};

const buildSearchPrefixes = (...terms: (string | null | undefined)[]): string[] => {
  const prefixes = new Set<string>();

  const addPrefixes = (term: string) => {
    const normalized = term.trim().toLowerCase();
    if (!normalized) {
      return;
    }

    let prefix = "";
    for (const char of normalized) {
      prefix += char;
      prefixes.add(prefix);
    }

    const segments = normalized.split(/\s+/g);
    for (const segment of segments) {
      let segmentPrefix = "";
      for (const char of segment) {
        segmentPrefix += char;
        prefixes.add(segmentPrefix);
      }
    }
  };

  for (const term of terms) {
    if (typeof term === "string") {
      addPrefixes(term);
    }
  }

  return Array.from(prefixes);
};

const mapProduct = (doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>): Product => {
  const data = doc.data() ?? {};

  const images = ensureArray<string>(data.images, data.image ? [data.image] : []);
  const additionalImages = ensureArray<string>(data.additionalImages, images.slice(1));

  const ratingAvg = typeof data.ratingAvg === "number" ? data.ratingAvg : typeof data.averageRating === "number" ? data.averageRating : undefined;
  const ratingCount = typeof data.ratingCount === "number" ? data.ratingCount : typeof data.reviewCount === "number" ? data.reviewCount : undefined;

  const createdAtISO = toISO(data.createdAt) ?? new Date().toISOString();
  const updatedAtISO = toISO(data.updatedAt);

  const product: Product = {
    id: doc.id,
    name: data.name ?? "",
    slug: data.slug ?? doc.id,
    description: data.description,
    details: data.details,
    sku: data.sku,
    barcode: data.barcode,
    price: typeof data.price === "number" ? data.price : 0,
    onSale: coerceBoolean(data.onSale),
    salePrice: typeof data.salePrice === "number" ? data.salePrice : null,
    category: data.category ?? "",
    subcategory: data.subcategory,
    images,
    image: images[0],
    additionalImages,
    placements: ensureArray<string>(data.placements),
    designThemes: ensureArray<string>(data.designThemes),
    tags: ensureArray<string>(data.tags),
    brand: data.brand,
    manufacturer: data.manufacturer,
    dimensions: data.dimensions,
    weight: data.weight,
    shippingWeight: data.shippingWeight,
    material: data.material,
    finish: data.finish,
    color: data.color,
    baseColor: data.baseColor,
    colorDisplayName: data.colorDisplayName,
    stickySide: data.stickySide,
    size: data.size,
    productType: data.productType,
    inStock: coerceBoolean(data.inStock),
    costPrice: typeof data.costPrice === "number" ? data.costPrice : undefined,
    stockQuantity: typeof data.stockQuantity === "number" ? data.stockQuantity : undefined,
    lowStockThreshold: typeof data.lowStockThreshold === "number" ? data.lowStockThreshold : undefined,
    shippingClass: data.shippingClass,
    badge: data.badge,
    isFeatured: coerceBoolean(data.isFeatured),
    isHero: coerceBoolean(data.isHero),
    isLiked: coerceBoolean(data.isLiked),
    isCustomizable: coerceBoolean(data.isCustomizable),
    isNewArrival: coerceBoolean(data.isNewArrival),
    ratingAvg: ratingAvg,
    ratingCount: ratingCount,
    averageRating: ratingAvg,
    reviewCount: ratingCount,
    createdAtISO,
    updatedAtISO,
    createdAt: createdAtISO,
    updatedAt: updatedAtISO,
  };

  return product;
};

const setProductCache = (id: ProductId, product: Product) => {
  productCache.set(id, { value: product, expiresAt: Date.now() + CACHE_TTL_MS });
};

const getProductFromCache = (id: ProductId): Product | null => {
  const entry = productCache.get(id);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt < Date.now()) {
    productCache.delete(id);
    return null;
  }

  return entry.value;
};

const invalidateProductCache = (id: ProductId) => {
  productCache.delete(id);
};

const parseCursor = (cursor: string | null | undefined): unknown[] | null => {
  if (!cursor) {
    return null;
  }

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    return JSON.parse(decoded) as unknown[];
  } catch (error) {
    console.warn("[productsService] Failed to parse cursor", error);
    return null;
  }
};

type Ordering = {
  field: string | FirebaseFirestore.FieldPath;
  direction: FirebaseFirestore.OrderByDirection;
  isDocumentId?: boolean;
};

const encodeCursor = (
  doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>,
  orderings: Ordering[],
): string => {
  const values = orderings.map(ordering => {
    if (ordering.isDocumentId) {
      return doc.id;
    }

    return doc.get(ordering.field as string | FirebaseFirestore.FieldPath);
  });

  return Buffer.from(JSON.stringify(values)).toString("base64url");
};

export const listProducts = async (params: ListParams): Promise<ListResult> => {
  const db = getAdminFirestore();
  const collectionRef = db.collection("products");

  const limit = Math.min(Math.max(params.limit ?? 24, 1), 100);
  const normalizedCategory = params.category?.trim();
  const normalizedQuery = params.q?.trim().toLowerCase();

  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = collectionRef;

  if (normalizedCategory) {
    query = query.where("category", "==", normalizedCategory);
  }

  if (typeof params.onSale === "boolean") {
    query = query.where("onSale", "==", params.onSale);
  }

  if (normalizedQuery) {
    query = query.where("searchPrefixes", "array-contains", normalizedQuery);
  }

  const orderings: Ordering[] = [];

  switch (params.sort) {
    case "priceAsc":
      orderings.push({ field: "price", direction: "asc" });
      break;
    case "priceDesc":
      orderings.push({ field: "price", direction: "desc" });
      break;
    case "rating":
      orderings.push({ field: "ratingAvg", direction: "desc" });
      break;
    case "new":
    default:
      orderings.push({ field: "createdAt", direction: "desc" });
      break;
  }

  orderings.push({ field: FieldPath.documentId(), direction: "asc", isDocumentId: true });

  for (const ordering of orderings) {
    query = query.orderBy(ordering.field, ordering.direction);
  }

  const cursorValues = parseCursor(params.cursor ?? null);
  if (cursorValues) {
    query = query.startAfter(...cursorValues);
  }

  const snapshot = await query.limit(limit + 1).get();

  const docs = snapshot.docs.slice(0, limit);
  const items = docs.map(mapProduct);

  let nextCursor: string | null = null;
  if (snapshot.docs.length > limit) {
    const lastDoc = snapshot.docs[limit - 1] ?? snapshot.docs[snapshot.docs.length - 1];
    if (lastDoc) {
      nextCursor = encodeCursor(lastDoc, orderings);
    }
  }

  return { items, nextCursor };
};

export const getProductById = async (id: ProductId): Promise<Product | null> => {
  const cached = getProductFromCache(id);
  if (cached) {
    return cached;
  }

  const doc = await productsCollection().doc(id).get();
  if (!doc.exists) {
    return null;
  }

  const product = mapProduct(doc);
  setProductCache(id, product);
  return product;
};

const prepareWriteBase = (input: Omit<Product, "id" | "createdAtISO" | "updatedAtISO" | "createdAt" | "updatedAt">) => {
  const slug = input.slug ?? "";
  const name = input.name ?? "";
  const images = input.images?.length ? input.images : input.image ? [input.image, ...(input.additionalImages ?? [])] : [];

  return {
    ...input,
    slug,
    name,
    images,
    image: input.image ?? images[0] ?? null,
    additionalImages: input.additionalImages ?? images.slice(1),
    ratingAvg: input.ratingAvg ?? input.averageRating ?? 0,
    ratingCount: input.ratingCount ?? input.reviewCount ?? 0,
    averageRating: input.ratingAvg ?? input.averageRating ?? 0,
    reviewCount: input.ratingCount ?? input.reviewCount ?? 0,
    nameLowercase: name.toLowerCase(),
    slugLowercase: slug.toLowerCase(),
    searchPrefixes: buildSearchPrefixes(name, slug),
  };
};

export const createProduct = async (
  input: Omit<Product, "id" | "createdAtISO" | "updatedAtISO" | "createdAt" | "updatedAt">,
): Promise<ProductId> => {
  const prepared = prepareWriteBase(input);

  const docRef = await productsCollection().add({
    ...prepared,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return docRef.id;
};

export const updateProduct = async (
  id: ProductId,
  patch: Partial<Omit<Product, "id" | "createdAtISO" | "createdAt">>,
): Promise<void> => {
  const docRef = productsCollection().doc(id);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    throw new Error("Product not found");
  }

  const data = snapshot.data() ?? {};
  const nextName = patch.name ?? data.name ?? "";
  const nextSlug = patch.slug ?? data.slug ?? id;
  const nextImages = patch.images ?? data.images ?? [];

  const updates: Record<string, unknown> = {
    ...patch,
    images: nextImages,
    image: patch.image ?? (Array.isArray(nextImages) && nextImages.length > 0 ? nextImages[0] : data.image ?? null),
    additionalImages: patch.additionalImages ?? (Array.isArray(nextImages) ? nextImages.slice(1) : data.additionalImages ?? []),
    nameLowercase: nextName.toLowerCase(),
    slugLowercase: nextSlug.toLowerCase(),
    searchPrefixes: buildSearchPrefixes(nextName, nextSlug),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (typeof patch.ratingAvg === "number" || typeof patch.ratingCount === "number") {
    const ratingAvg =
      typeof patch.ratingAvg === "number" ? patch.ratingAvg : typeof data.ratingAvg === "number" ? data.ratingAvg : undefined;
    const ratingCount =
      typeof patch.ratingCount === "number"
        ? patch.ratingCount
        : typeof data.ratingCount === "number"
          ? data.ratingCount
          : undefined;

    if (typeof ratingAvg === "number") {
      updates.ratingAvg = ratingAvg;
      updates.averageRating = ratingAvg;
    }
    if (typeof ratingCount === "number") {
      updates.ratingCount = ratingCount;
      updates.reviewCount = ratingCount;
    }
  }

  await docRef.update(updates);
  invalidateProductCache(id);
};

export const deleteProduct = async (id: ProductId): Promise<void> => {
  await productsCollection().doc(id).delete();
  invalidateProductCache(id);
};

export const rateProduct = async ({
  productId,
  userId,
  rating,
  authorName,
}: {
  productId: ProductId;
  userId: string;
  rating: number;
  authorName?: string;
}): Promise<{ ratingAvg: number; ratingCount: number }> => {
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const db = getAdminFirestore();
  const productRef = db.collection("products").doc(productId);
  const ratingRef = productRef.collection("ratings").doc(userId);

  const { ratingAvg, ratingCount } = await db.runTransaction(async transaction => {
    const productSnap = await transaction.get(productRef);
    if (!productSnap.exists) {
      throw new Error("Product not found");
    }

    const currentData = productSnap.data() ?? {};
    const currentAvg = typeof currentData.ratingAvg === "number" ? currentData.ratingAvg : typeof currentData.averageRating === "number" ? currentData.averageRating : 0;
    const currentCount = typeof currentData.ratingCount === "number" ? currentData.ratingCount : typeof currentData.reviewCount === "number" ? currentData.reviewCount : 0;

    const ratingSnap = await transaction.get(ratingRef);

    let nextCount = currentCount;
    let runningTotal = currentAvg * currentCount;

    if (ratingSnap.exists) {
      const previousRating = ratingSnap.data()?.rating ?? 0;
      runningTotal = runningTotal - previousRating + rating;
    } else {
      nextCount += 1;
      runningTotal += rating;
    }

    const nextAvg = nextCount > 0 ? runningTotal / nextCount : 0;

    transaction.set(
      ratingRef,
      {
        userId,
        rating,
        authorName,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    transaction.update(productRef, {
      ratingAvg: nextAvg,
      ratingCount: nextCount,
      averageRating: nextAvg,
      reviewCount: nextCount,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { ratingAvg: nextAvg, ratingCount: nextCount };
  });

  invalidateProductCache(productId);

  return { ratingAvg, ratingCount };
};
