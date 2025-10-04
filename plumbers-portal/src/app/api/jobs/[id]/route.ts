// src/app/api/jobs/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/require-session";
import { jobService } from "@/lib/services/job-service";
import { isAdmin } from "@/lib/auth/roles";

const updateJobSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  urgency: z.enum(["emergency", "urgent", "soon", "flexible"]).optional(),
  location: z.object({ postcode: z.string().min(1), address: z.string().optional() }).optional(),
  budget: z.number().positive().optional(),
  serviceType: z.string().optional(),
  scheduledDate: z
    .string()
    .transform(v => new Date(v))
    .optional(),
  // if your edit form sends photos/attachments, accept them here:
  photos: z.array(z.string().url()).optional()
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();

  const { id } = await params;
  const job = await jobService.getJobById(id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const isOwner = job.customerId === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = updateJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updatedJob = await jobService.updateJob(id, parsed.data);
  return NextResponse.json(updatedJob);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    await jobService.adminDeleteJob(jobId);

    return NextResponse.json({ success: true, message: "Job and all associated data deleted successfully." });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
