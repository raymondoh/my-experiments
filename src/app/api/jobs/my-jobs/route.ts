//src/app/api/jobs/route.ts
import { NextResponse } from "next/server";
import { jobService } from "@/lib/services/job-service";
import { requireSession } from "@/lib/auth/require-session";

// Fetch jobs for the logged-in customer (or admin viewing their own)
export async function GET() {
  try {
    const session = await requireSession();

    if (session.user.role !== "customer" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const jobs = await jobService.getJobsByCustomer(session.user.id);
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("API Error - /api/jobs/my-jobs:", error);
    return NextResponse.json({ error: "Failed to fetch customer jobs" }, { status: 500 });
  }
}
