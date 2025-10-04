"use server";

import { revalidatePath } from "next/cache";

import { createProduct, deleteProduct, updateProduct } from "@/lib/services/products";

import { createProductSchema, updateProductSchema } from "./product-schemas";

export async function createProductAction(form: FormData) {
  const data = Object.fromEntries(form.entries());
  const parsed = createProductSchema.safeParse({
    name: data.name,
    slug: data.slug,
    price: data.price,
    category: data.category,
    images: (data.images as string | undefined)?.split(",").map(value => value.trim()).filter(Boolean) ?? [],
    onSale: data.onSale === "on" || data.onSale === "true",
    salePrice: data.salePrice,
  });

  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() };
  }

  const id = await createProduct(parsed.data);
  revalidatePath("/(dashboard)/admin/products");

  return { ok: true as const, id };
}

export async function updateProductAction(id: string, form: FormData) {
  const data = Object.fromEntries(form.entries());
  const parsed = updateProductSchema.safeParse({
    name: data.name,
    slug: data.slug,
    price: data.price,
    category: data.category,
    images: (data.images as string | undefined)?.split(",").map(value => value.trim()).filter(Boolean),
    onSale: data.onSale === "on" || data.onSale === "true",
    salePrice: data.salePrice,
  });

  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() };
  }

  await updateProduct(id, parsed.data);
  revalidatePath("/(dashboard)/admin/products");

  return { ok: true as const };
}

export async function deleteProductAction(id: string) {
  await deleteProduct(id);
  revalidatePath("/(dashboard)/admin/products");
  return { ok: true as const };
}
