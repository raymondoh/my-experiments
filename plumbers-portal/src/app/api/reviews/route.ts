// src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/require-session";
import { reviewService } from "@/lib/services/review-service";
import { jobService } from "@/lib/services/job-service"; // Import jobService to verify ownership

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const reviewSchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
  tradespersonId: z.string().min(1, "tradespersonId is required"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional().default("")
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    // Only customers (and admins) can create reviews
    if (!["customer", "admin"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", issues: parsed.error.issues },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const { jobId, tradespersonId, rating, comment } = parsed.data;

    // --- Ownership Verification ---
    // Fetch the job to ensure the person leaving the review is the job owner.
    const job = await jobService.getJobById(jobId);
    if (!job || (session.user.role === "customer" && job.customerId !== session.user.id)) {
      return NextResponse.json(
        { error: "Forbidden: You can only review your own jobs." },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }
    // --- End Ownership Verification ---

    const review = await reviewService.createReview({
      jobId,
      tradespersonId,
      customerId: session.user.id,
      rating,
      comment
    });

    return NextResponse.json(review, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Error creating review", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
