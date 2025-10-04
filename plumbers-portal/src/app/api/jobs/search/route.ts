// src/app/api/jobs/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { jobService } from "@/lib/services/job-service";
import { geocodingService } from "@/lib/services/geocoding-service";
import type { JobUrgency, SearchParams } from "@/lib/types/job";
import { z } from "zod";
import { requireSession } from "@/lib/auth/require-session"; // ✅ path fixed

const searchQuerySchema = z.object({
  q: z.string().optional(),
  urgency: z.enum(["emergency", "urgent", "soon", "flexible"]).optional(),
  serviceType: z.string().optional(),
  location: z.string().optional(),
  radius: z.coerce.number().positive().optional(),
  minBudget: z.coerce.number().nonnegative().optional(),
  maxBudget: z.coerce.number().nonnegative().optional(),
  noQuotes: z.coerce.boolean().optional(),
  datePosted: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(["newest", "relevance", "urgency", "budget_high", "budget_low", "distance"]).optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!["tradesperson", "business_owner", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = searchQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues, message: "Invalid query parameters" }, { status: 400 });
    }

    const params: SearchParams = {};
    if (parsed.data.q) params.query = parsed.data.q;
    if (parsed.data.urgency) params.urgency = parsed.data.urgency as JobUrgency;
    if (parsed.data.serviceType) params.skills = [parsed.data.serviceType];
    if (parsed.data.sortBy) params.sortBy = parsed.data.sortBy;

    if (parsed.data.location) {
      const coords = await geocodingService.getCoordinatesFromPostcode(parsed.data.location);
      if (coords) {
        params.location = `${coords.coordinates.latitude},${coords.coordinates.longitude}`;
      }
    }

    if (parsed.data.radius) params.radius = parsed.data.radius;
    if (parsed.data.minBudget !== undefined) params.minBudget = parsed.data.minBudget;
    if (parsed.data.maxBudget !== undefined) params.maxBudget = parsed.data.maxBudget;
    if (parsed.data.noQuotes !== undefined) params.noQuotes = parsed.data.noQuotes;
    if (parsed.data.datePosted !== undefined) params.datePosted = parsed.data.datePosted;
    if (parsed.data.page !== undefined) params.page = parsed.data.page;
    if (parsed.data.limit !== undefined) params.limit = parsed.data.limit;

    const result = await jobService.searchJobs(params);

    const serializedJobs = result.jobs.map(job => ({
      ...job,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      scheduledDate: job.scheduledDate?.toISOString(),
      completedDate: job.completedDate?.toISOString()
    }));

    return NextResponse.json({ ...result, jobs: serializedJobs });
  } catch (error) {
    console.error("Error searching jobs:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid query" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to search jobs" }, { status: 500 });
  }
}
