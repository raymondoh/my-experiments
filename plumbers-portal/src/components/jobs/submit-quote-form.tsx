"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { PoundSterlingIcon as Pound, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

const quoteFormSchema = z
  .object({
    price: z
      .string()
      .min(1, "Price is required")
      .refine(val => {
        const num = Number(val);
        return !Number.isNaN(num) && num >= 1;
      }, "Price must be at least £1"),
    depositAmount: z.string().optional(),
    description: z.string().min(10, "Description must be at least 10 characters"),
    estimatedDuration: z.string().min(1, "Please provide an estimated duration"),
    // --- THIS IS THE FIX (Part 1) ---
    // The schema now expects a string from the native date input, not a Date object.
    availableDate: z.string().min(1, "Available date is required")
  })
  .refine(
    data => {
      if (!data.depositAmount) return true;
      const price = Number(data.price);
      const deposit = Number(data.depositAmount);
      return deposit <= price;
    },
    {
      message: "Deposit cannot be greater than the total price",
      path: ["depositAmount"]
    }
  );

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

interface SubmitQuoteFormProps {
  jobId: string;
  tierOverride?: "basic" | "pro" | "business";
}

export function SubmitQuoteForm({ jobId, tierOverride }: SubmitQuoteFormProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const effectiveTier = (tierOverride ?? session?.user?.subscriptionTier ?? "basic") as "basic" | "pro" | "business";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [limitError, setLimitError] = useState<{
    message: string;
    used?: number;
    limit?: number;
  } | null>(null);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      price: "",
      depositAmount: "",
      description: "",
      estimatedDuration: "",
      // --- THIS IS THE FIX (Part 2) ---
      // Default value is now an empty string to match the input type.
      availableDate: ""
    }
  });

  async function onSubmit(data: QuoteFormValues) {
    setIsSubmitting(true);
    setLimitError(null);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          price: Number(data.price),
          depositAmount: data.depositAmount ? Number(data.depositAmount) : undefined,
          description: data.description,
          estimatedDuration: data.estimatedDuration,
          // The API route can parse the date string from the input
          availableDate: data.availableDate
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (
          response.status === 403 &&
          (result.code === "quote_limit" || String(result.message || "").includes("quote limit"))
        ) {
          setLimitError({
            message: result.message || "You've reached your monthly quote limit.",
            used: typeof result.used === "number" ? result.used : undefined,
            limit: typeof result.limit === "number" ? result.limit : undefined
          });
          return;
        }
        throw new Error(result.message || "Failed to submit quote");
      }
      router.push("/dashboard/tradesperson/job-board?quote_sent=true");
      router.refresh();
    } catch (error) {
      toast.error("Failed to submit quote", {
        description: (error as Error).message || "Something went wrong. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="h-10 w-1/2 bg-muted rounded animate-pulse" />
          <div className="h-24 w-full bg-muted rounded animate-pulse" />
          <div className="h-10 w-40 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (limitError) {
    const { used, limit, message } = limitError;
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Quote Limit Reached</AlertTitle>
        <AlertDescription>
          <p>{message}</p>
          {typeof used === "number" && typeof limit === "number" && (
            <p className="mt-2 text-sm text-muted-foreground">
              Usage this month: <strong>{used}</strong> / {limit}
            </p>
          )}
          <Button asChild className="mt-4">
            <Link href="/pricing">Upgrade Your Plan</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const showBasicInfo = effectiveTier === "basic";

  return (
    <>
      {showBasicInfo && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Basic plan</AlertTitle>
          <AlertDescription className="text-sm">
            You can submit up to <strong>5 quotes per month</strong> on the Basic plan. If you reach the limit, we’ll
            prompt you to upgrade.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Quote Price (£)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Pound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g. 150" className="pl-9" type="text" inputMode="decimal" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="depositAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Required (£, Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Pound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g. 50" className="pl-9" type="text" inputMode="decimal" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="estimatedDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Duration</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 2–3 hours, 1 day" {...field} />
                </FormControl>
                <FormDescription>How long do you expect this job to take?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* --- THIS IS THE FIX (Part 3) --- */}
          {/* Replaced the Popover/Calendar component with a simple date input */}
          <FormField
            control={form.control}
            name="availableDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Available Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>When can you start working on this job?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your approach to this job, any materials needed, and why you're the right person."
                    className="min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Provide details about your quote and approach to the job</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/tradesperson/job-board/${jobId}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Quote"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
