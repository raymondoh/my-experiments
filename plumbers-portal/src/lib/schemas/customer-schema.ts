import { z } from "zod";

export const customerProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional().nullable(),
  postcode: z.string().optional().nullable(),
  town: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  businessName: z.string().optional().nullable(),
  profilePicture: z.string().optional().nullable()
});
