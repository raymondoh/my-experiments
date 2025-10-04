// src/components/profile/edit-profile-form.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";
import type { Session } from "next-auth";
import type { User } from "@/lib/types/user";
import Link from "next/link";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, User as UserIcon, MapPin, X } from "lucide-react";
import { storageService } from "@/lib/services/storage-service";
import { ensureFirebaseAuth } from "@/lib/firebase/client";
import { useSession } from "next-auth/react";
import { customerProfileSchema } from "@/lib/schemas/customer-schema";

type FormData = z.infer<typeof customerProfileSchema>;

export function EditProfileForm({ user, backPath }: { user: User; backPath: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialProfileImage = user.profilePicture || user.image || null;
  const [imagePreview, setImagePreview] = useState<string | null>(initialProfileImage);
  const { data: session, update } = useSession();

  const form = useForm<FormData>({
    resolver: zodResolver(customerProfileSchema),
    defaultValues: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      address: user.location?.address || "",
      town: user.location?.town || "",
      postcode: user.location?.postcode || "",
      profilePicture: initialProfileImage || "",
      businessName: user.businessName || ""
    }
  });

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image file is too large. Please select a file under 2MB.");
      return;
    }

    const authUser = await ensureFirebaseAuth();
    if (!authUser) {
      toast.error("Please sign in again to upload images.");
      return;
    }

    try {
      toast.info("Uploading image...");
      const path = `users/${user.id}/profilePicture/${Date.now()}-${file.name}`;
      const downloadURL = await storageService.uploadFile(file, path);
      setImagePreview(downloadURL);
      form.setValue("profilePicture", downloadURL);
      toast.success("Image uploaded successfully.");
    } catch (error) {
      console.error("Profile picture upload error:", error);
      toast.error("Failed to upload image. Please try again.");
    }
  };

  async function onSubmit(data: FormData) {
    console.log("[EditProfileForm] onSubmit triggered");
    setIsSubmitting(true);

    try {
      const submissionData = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        profilePicture: data.profilePicture,
        businessName: data.businessName || null,
        address: data.address,
        town: data.town,
        postcode: data.postcode
      };

      console.log("[EditProfileForm] Submitting data:", submissionData);

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData)
      });

      console.log("[EditProfileForm] Response status:", response.status);
      const result = await response.json();
      console.log("[EditProfileForm] Response result:", result);

      if (!response.ok) throw new Error(result.error || "An error occurred.");

      toast.success("Profile saved successfully!");

      const updatedName =
        result.user.name || [result.user.firstName, result.user.lastName].filter(Boolean).join(" ") || user.name || "";
      const updatedImage = result.user.profilePicture || result.user.image || null;

      const nextUser = {
        ...(session?.user ?? {}),
        name: updatedName
      } as Session["user"];

      nextUser.image = updatedImage;

      await update({ user: nextUser });

      const redirectUrl = new URL(backPath, window.location.origin);
      redirectUrl.searchParams.set("profile_saved", "true");
      router.push(redirectUrl.toString());
      router.refresh();
      console.log("[EditProfileForm] Profile update successful");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submission failed.");
      console.error("[EditProfileForm] Profile update failed:", error);
    } finally {
      setIsSubmitting(false); // This ensures the spinner always stops
    }
  }

  const firstName = form.watch("firstName");
  const lastName = form.watch("lastName");
  const fallbackInitials = (() => {
    const firstInitial = firstName?.trim()?.[0];
    const lastInitial = lastName?.trim()?.[0];
    if (firstInitial || lastInitial) {
      return `${firstInitial ?? ""}${lastInitial ?? ""}`.toUpperCase();
    }

    if (user.name) {
      const nameInitials = user.name
        .split(" ")
        .filter(Boolean)
        .map(part => part[0]?.toUpperCase())
        .join("");
      if (nameInitials) return nameInitials;
    }

    if (user.email) {
      return user.email[0]?.toUpperCase() ?? null;
    }

    return null;
  })();

  const avatarAltText =
    [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ") ||
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email ||
    "Profile picture";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Update Your Information</CardTitle>
            <CardDescription>
              Make sure your details are correct to ensure a smooth experience on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <FormField
              control={form.control}
              name="profilePicture"
              render={() => (
                <FormItem>
                  <FormLabel>Profile Picture</FormLabel>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={imagePreview || ""} alt={avatarAltText} />
                      <AvatarFallback className="text-3xl font-semibold">
                        {fallbackInitials ?? <UserIcon className="h-12 w-12" />}
                      </AvatarFallback>
                    </Avatar>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileChange}
                        className="max-w-xs"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* --- Personal Information Section --- */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
                Personal Details
              </h3>
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. BB Plumbing Ltd" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g.John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="07123 456789" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* --- Location Information Section --- */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                Location Details
              </h3>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="123 High Street" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="town"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Town/City</FormLabel>
                      <FormControl>
                        <Input placeholder="London" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postcode</FormLabel>
                      <FormControl>
                        <Input placeholder="SW1A 1AA" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href={backPath}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
