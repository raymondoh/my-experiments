//src/app/api/jobs/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { jobService } from "@/lib/services/job-service";
import { requireSession } from "@/lib/auth/require-session";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export async function GET(_request: NextRequest) {
  try {
    const session = await requireSession();

    if (!["tradesperson", "business_owner", "admin"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const jobs = await jobService.getOpenJobs();
    const serializedJobs = jobs.map(job => ({
      ...job,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      scheduledDate: job.scheduledDate?.toISOString(),
      completedDate: job.completedDate?.toISOString()
    }));

    return NextResponse.json({ jobs: serializedJobs }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

// Zod schema for job creation
const createJobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  urgency: z.enum(["emergency", "urgent", "soon", "flexible"]),
  location: z.object({
    postcode: z.string().min(1),
    address: z.string().optional()
  }),
  customerContact: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1)
  }),
  budget: z.number().positive().optional(),
  serviceType: z.string().optional(),
  photos: z.array(z.string()).optional(),
  scheduledDate: z
    .string()
    .transform(val => new Date(val))
    .optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    if (!["customer", "admin"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const json = await request.json();
    const parsed = createJobSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const data = parsed.data;
    const job = await jobService.createJob({
      title: data.title,
      description: data.description,
      urgency: data.urgency,
      location: data.location,
      budget: data.budget,
      serviceType: data.serviceType,
      photos: data.photos,
      scheduledDate: data.scheduledDate,
      customerId: session.user.id,
      customerContact: {
        name: data.customerContact.name,
        email: session.user.email ?? data.customerContact.email,
        phone: data.customerContact.phone
      }
    });

    return NextResponse.json(job, { status: 201, headers: NO_STORE_HEADERS });
  } catch (err) {
    console.error("Error creating job:", err);
    const message = err instanceof Error ? err.message : "Failed to create job";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
