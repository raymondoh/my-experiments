import { z } from "zod";

export const userBase = z.object({
  name: z.string().min(2).nullable().optional(),
  email: z.string().email(),
  image: z.string().url().nullable().optional(),
  role: z.enum(["user", "admin"]).default("user"),
});

export const createUserSchema = userBase;
export const updateUserSchema = userBase.partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
