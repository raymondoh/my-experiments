import { z } from "zod";

export const productBase = z
  .object({
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    price: z.coerce.number().nonnegative(),
    category: z.string().min(1),
    images: z.array(z.string().url()).default([]),
    onSale: z.boolean().default(false),
    salePrice: z.coerce.number().nonnegative().nullable().optional(),
  })
  .refine(v => !v.onSale || (v.salePrice ?? 0) < v.price, {
    message: "Sale price must be less than price",
    path: ["salePrice"],
  });

export const createProductSchema = productBase;
export const updateProductSchema = productBase.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
