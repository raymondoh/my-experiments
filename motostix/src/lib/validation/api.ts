import { z } from "zod";

// Shared primitives
export const productId = z.string().min(1, "productId required");
export const cursor = z.string().min(1).optional().nullable();
export const limit = z.coerce.number().int().min(1).max(48).default(24);
export const sort = z.enum(["new", "priceAsc", "priceDesc", "rating"]).optional();
export const category = z.string().min(1).optional();
export const onSale = z
  .union([z.literal("true"), z.literal("false")])
  .transform(v => v === "true")
  .optional();
export const q = z.string().min(1).optional();

// GET /api/products query
export const listProductsQuery = z.object({ q, category, onSale, limit, cursor, sort });

// POST /api/products body (minimal — extend as your schema requires)
export const createProductBody = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  price: z.number().nonnegative(),
  category: z.string().min(1),
  images: z.array(z.string().url()).default([]),
  onSale: z.boolean().optional(),
  salePrice: z.number().nonnegative().nullable().optional(),
});

// PUT /api/products/[id] body (patch)
export const updateProductBody = createProductBody.partial();

// POST /api/ratings body
export const rateProductBody = z.object({
  productId: productId,
  rating: z.number().int().min(1).max(5),
});

// Helper: parse URLSearchParams with a schema
export function parseSearchParams<T extends z.ZodTypeAny>(schema: T, sp: URLSearchParams) {
  const data: Record<string, string> = {};
  for (const [k, v] of sp.entries()) data[k] = v;
  return schema.safeParse(data);
}
