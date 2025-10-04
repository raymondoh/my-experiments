// src/components/jobs/create-job-form.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { User } from "@/lib/types/user";
import Image from "next/image";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { storageService } from "@/lib/services/storage-service";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide a more detailed description of the job"),
  postcode: z.string().min(3, "A valid postcode is required"),
  address: z.string().optional(),
  urgency: z.enum(["emergency", "urgent", "soon", "flexible"]),
  budget: z.string().optional(),
  serviceType: z.string().optional(),
  preferredDate: z.string().optional(),
  photos: z.array(z.string()).max(5).optional()
});

type FormValues = z.infer<typeof formSchema>;

const urgencyOptions = [
  { value: "emergency", label: "Emergency (ASAP)" },
  { value: "urgent", label: "Urgent (This week)" },
  { value: "soon", label: "Soon (Next 2 weeks)" },
  { value: "flexible", label: "Flexible" }
];

const serviceTypes = [
  "Boiler Repair & Installation",
  "Leak Detection & Repair",
  "Drain Cleaning & Unblocking",
  "Bathroom Plumbing",
  "Kitchen Plumbing",
  "Gas Services",
  "Central Heating Systems",
  "Water Heater Installation",
  "General Plumbing",
  "Other"
];

export function CreateJobForm({ user }: { user: User }) {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      postcode: user.location?.postcode || "",
      address: user.location?.address || "",
      urgency: "flexible",
      budget: "",
      serviceType: "",
      preferredDate: "",
      photos: []
    }
  });

  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    let currentPhotos = form.getValues("photos") || [];

    for (const file of files) {
      if (currentPhotos.length >= 5) {
        toast.error("You can upload up to 5 photos.");
        break;
      }
      if (file.size > MAX_PHOTO_SIZE) {
        toast.error("Image file is too large. Please select a file under 5MB.");
        form.setError("photos", { type: "manual", message: "File too large" });
        continue;
      }

      form.clearErrors("photos");

      try {
        toast.info("Uploading image...");
        const path = `jobs/${user.id}/${Date.now()}-${file.name}`;
        const downloadURL = await storageService.uploadFile(file, path);
        currentPhotos = [...currentPhotos, downloadURL];
        setPhotoPreviews(prev => [...prev, downloadURL]);
        form.setValue("photos", currentPhotos);
        toast.success("Image uploaded successfully.");
      } catch (error) {
        console.error("Photo upload error:", error);
        toast.error("Failed to upload image. Please try again.");
      }
    }

    // Reset the input so the same file can be reselected if needed
    event.target.value = "";
  };

  const removePhoto = (index: number) => {
    // --- FIX STARTS HERE ---
    // 1. Update the UI state based on its current value
    const updatedPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotoPreviews(updatedPreviews);
    // 2. Update the form state with the same new array
    form.setValue("photos", updatedPreviews);
    // --- FIX ENDS HERE ---
  };

  async function onSubmit(values: FormValues) {
    // THE FIX: Create a base payload and then conditionally add optional fields.
    // This ensures no 'undefined' values are sent to Firestore.
    const location: any = { postcode: values.postcode };
    if (values.address) location.address = values.address;

    const payload: any = {
      title: values.title,
      description: values.description,
      urgency: values.urgency,
      location,
      customerContact: {
        name: user.name || `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone
      }
    };

    if (values.budget) payload.budget = Number(values.budget);
    if (values.serviceType) payload.serviceType = values.serviceType;
    if (values.preferredDate) payload.scheduledDate = new Date(values.preferredDate);
    if (values.photos && values.photos.length) payload.photos = values.photos;

    try {
      toast.info("Posting your job...");
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create job");
      }

      //toast.success("Job posted successfully!");
      router.push("/dashboard/customer/jobs?job_posted=true");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter Job Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Leaking Kitchen Tap" {...field} />
                  </FormControl>
                  <FormDescription>Provide a short, clear title for the job.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-32"
                      placeholder="Describe the issue in as much detail as possible..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="postcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postcode</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SW1A 1AA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123 High Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="urgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Urgency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {urgencyOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" placeholder="e.g., 150" {...field} />
                  </FormControl>
                  <FormDescription>Helps tradespeople give a more accurate quote.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serviceTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photos"
              render={() => (
                <FormItem>
                  <FormLabel>Photos (Optional)</FormLabel>
                  <FormDescription>Upload images to help tradespeople understand the job.</FormDescription>
                  <FormControl>
                    <Input
                      type="file"
                      multiple
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handlePhotoChange}
                    />
                  </FormControl>
                  {photoPreviews.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {photoPreviews.map((src, idx) => (
                        <div key={idx} className="relative h-20 w-20">
                          <Image
                            src={src}
                            alt="Job photo"
                            width={80} // matches w-20
                            height={80} // matches h-20
                            className="h-full w-full object-cover rounded"
                            sizes="80px"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="absolute -top-2 -right-2 bg-white border rounded-full p-1 text-xs"
                            aria-label="Remove photo">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {form.formState.isSubmitting ? "Posting Job..." : "Post Job"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
