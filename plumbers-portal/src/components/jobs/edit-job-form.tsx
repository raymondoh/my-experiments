// export default EditJobForm;
// src/components/jobs/edit-job-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { Job } from "@/lib/types/job";
import { useState, ChangeEvent } from "react";
import Image from "next/image";
import { storageService } from "@/lib/services/storage-service";

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";

// Zod schema for form validation
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide a more detailed description of the job"),
  postcode: z.string().min(3, "A valid postcode is required"),
  address: z.string().optional(),
  urgency: z.enum(["emergency", "urgent", "soon", "flexible"]),
  budget: z.string().optional(),
  serviceType: z.string().optional(),
  preferredDate: z.string().optional(),
  photos: z.array(z.string()).max(5).optional() // <-- Added photos field
});

type FormValues = z.infer<typeof formSchema>;

// Options for the urgency select input
const urgencyOptions = [
  { value: "emergency", label: "Emergency (ASAP)" },
  { value: "urgent", label: "Urgent (This week)" },
  { value: "soon", label: "Soon (Next 2 weeks)" },
  { value: "flexible", label: "Flexible" }
];

// Options for the service type select input
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

export function EditJobForm({ job }: { job: Job }) {
  const [photoPreviews, setPhotoPreviews] = useState<string[]>(job.photos || []);
  const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

  // Guard clause to handle cases where the job data might not be available on initial render.
  if (!job) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Job Details...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Initialize react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: job.title,
      description: job.description,
      postcode: job.location.postcode,
      address: job.location.address || "",
      urgency: job.urgency,
      budget: job.budget ? String(job.budget) : "",
      serviceType: job.serviceType || "",
      preferredDate: job.scheduledDate ? new Date(job.scheduledDate).toISOString().split("T")[0] : "",
      photos: job.photos || [] // <-- Initialize photos
    }
  });

  // Photo change handler
  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
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
        const path = `jobs/${job.customerId}/${Date.now()}-${file.name}`;
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

    event.target.value = "";
  };

  // Photo removal handler
  const removePhoto = (index: number) => {
    const updatedPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotoPreviews(updatedPreviews);
    form.setValue("photos", updatedPreviews);
  };

  // Handle form submission
  async function onSubmit(values: FormValues) {
    const location: any = { postcode: values.postcode };
    if (values.address) location.address = values.address;

    // Construct the payload with required and optional fields
    const payload: any = {
      title: values.title,
      description: values.description,
      urgency: values.urgency,
      location
    };

    if (values.budget) payload.budget = Number(values.budget);
    if (values.serviceType) payload.serviceType = values.serviceType;
    if (values.preferredDate) payload.scheduledDate = new Date(values.preferredDate);
    if (values.photos) payload.photos = values.photos; // <-- Add photos to payload

    try {
      toast.info("Updating job...");
      // Make PUT request to the API endpoint
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update job");
      }

      toast.success("Job updated successfully!");
      // Use window.location for navigation in non-Next.js environments
      window.location.href = `/dashboard/customer/jobs/${job.id}`;
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Edit Job Details</CardTitle>
            <CardDescription>Update the information for your job posting below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Job Title Field */}
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

            {/* Job Description Field */}
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

            {/* Location Fields */}
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

            {/* Urgency Field */}
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

            {/* Budget Field */}
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

            {/* Service Type Field */}
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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

            {/* Photos Field - START */}
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
                            width={80}
                            height={80}
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
            {/* Photos Field - END */}

            {/* Preferred Date Field */}
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
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => (window.location.href = `/dashboard/customer/jobs/${job.id}`)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

export default EditJobForm;
