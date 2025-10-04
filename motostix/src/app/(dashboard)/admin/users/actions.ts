"use server";

import { revalidatePath } from "next/cache";

import { upsertUserProfile } from "@/lib/services/users";

import { createUserSchema, updateUserSchema } from "./user-schemas";

const USERS_PATH = "/(dashboard)/admin/users";

const toOptionalString = (value: FormDataEntryValue | null | undefined) => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const toNullableString = (value: FormDataEntryValue | null | undefined) => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function createUserAction(form: FormData) {
  const data = Object.fromEntries(form.entries());
  const parsed = createUserSchema.safeParse({
    name: toNullableString(data.name),
    email: data.email,
    image: toNullableString(data.image),
    role: data.role,
  });

  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() };
  }

  const id = typeof data.id === "string" && data.id.trim().length > 0 ? data.id : crypto.randomUUID();

  const payload: Parameters<typeof upsertUserProfile>[1] = {
    email: parsed.data.email,
    role: parsed.data.role ?? "user",
    createdAtISO: new Date().toISOString(),
  };

  if (parsed.data.name !== undefined) {
    payload.name = parsed.data.name;
  }
  if (parsed.data.image !== undefined) {
    payload.image = parsed.data.image;
  }

  await upsertUserProfile(id, payload);
  revalidatePath(USERS_PATH);

  return { ok: true as const, id };
}

export async function updateUserAction(id: string, form: FormData) {
  const data = Object.fromEntries(form.entries());
  const parsed = updateUserSchema.safeParse({
    name: toNullableString(data.name),
    email: toOptionalString(data.email),
    image: toNullableString(data.image),
    role: data.role,
  });

  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() };
  }

  const payload: Parameters<typeof upsertUserProfile>[1] = {};

  if (parsed.data.name !== undefined) {
    payload.name = parsed.data.name;
  }
  if (parsed.data.email !== undefined) {
    payload.email = parsed.data.email;
  }
  if (parsed.data.image !== undefined) {
    payload.image = parsed.data.image;
  }
  if (parsed.data.role !== undefined) {
    payload.role = parsed.data.role;
  }

  await upsertUserProfile(id, payload);
  revalidatePath(USERS_PATH);

  return { ok: true as const };
}
