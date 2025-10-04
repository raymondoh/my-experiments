import { z } from "zod";
// --- THIS IS THE FIX ---
// Import the single source of truth for services.
import { ALL_SERVICES } from "@/lib/config/locations";

// Use the imported list directly. The name 'predefinedSpecialties' is kept
// here so the rest of the schema logic doesn't need to change.
const predefinedSpecialties = ALL_SERVICES;
// --- END OF FIX ---

export const tradespersonProfileSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().min(10, "A valid phone number is required"),
    postcode: z.string().min(3, "A valid postcode is required"),
    town: z.string().min(2, "Town/City is required"),
    address: z.string().optional(),
    businessName: z.string().optional(),
    googleBusinessProfileUrl: z.string().optional(),
    serviceAreas: z.string().min(3, "Service areas are required"),
    specialties: z.array(z.string()).min(1, "Please select at least one specialty."),
    otherSpecialty: z.string().optional(),
    experience: z.string().min(1, "Please select your years of experience."),
    description: z.string().optional(),
    hourlyRate: z.string().optional(),
    profilePicture: z.string().optional(),
    portfolio: z.array(z.string()).optional(),
    notificationSettings: z
      .object({
        newJobAlerts: z.boolean()
      })
      .optional()
  })
  .refine(
    data => {
      if (data.specialties.includes("Other") && !data.otherSpecialty?.trim()) {
        return false;
      }
      return true;
    },
    {
      message: "Please specify your other specialty",
      path: ["otherSpecialty"]
    }
  );
