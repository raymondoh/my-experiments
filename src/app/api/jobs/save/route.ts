//src/app/api/jobs/save/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { SavedJobsCollection } from "@/lib/firebase/admin";
import { config } from "@/lib/config/app-mode";
import { z } from "zod";
import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import type { Tier } from "@/lib/auth/require-tier";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const bodySchema = z.object({ jobId: z.string().min(1, "Job ID is required") });

// ---- in-memory store for dev/tests ----
declare global {
  var mockSavedJobs: Map<string, Set<string>> | undefined;
}
function store() {
  globalThis.mockSavedJobs ??= new Map<string, Set<string>>();
  return globalThis.mockSavedJobs;
}

async function requireProOrBusiness(userId: string, sessionTier?: string | null) {
  const dbUser = await userService.getUserById(userId);
  const tier = ((dbUser?.subscriptionTier ?? sessionTier ?? "basic") as Tier) || "basic";
  if (tier !== "pro" && tier !== "business") {
    return NextResponse.json(
      { message: "Saving jobs is a Pro feature. Please upgrade." },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (session.user.role !== "tradesperson") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid body", errors: parsed.error.issues },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Authoritative tier check
    const tierErr = await requireProOrBusiness(session.user.id, session.user.subscriptionTier);
    if (tierErr) return tierErr;

    const { jobId } = parsed.data;
    const tradespersonId = session.user.id;

    if (config.isMockMode) {
      const s = store();
      if (!s.has(tradespersonId)) s.set(tradespersonId, new Set());
      s.get(tradespersonId)!.add(jobId);
    } else {
      await SavedJobsCollection().doc(`${tradespersonId}_${jobId}`).set({
        tradespersonId,
        jobId,
        savedAt: new Date()
      });
    }

    return NextResponse.json(
      { message: "Job saved successfully" },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { message: err.issues[0]?.message ?? "Invalid body" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
    console.error("Error saving job:", err);
    return NextResponse.json(
      { message: "Failed to save job" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSession();
    if (session.user.role !== "tradesperson") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid body", errors: parsed.error.issues },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Authoritative tier check (optional but consistent)
    const tierErr = await requireProOrBusiness(session.user.id, session.user.subscriptionTier);
    if (tierErr) return tierErr;

    const { jobId } = parsed.data;
    const tradespersonId = session.user.id;

    if (config.isMockMode) {
      const s = store();
      if (s.has(tradespersonId)) s.get(tradespersonId)!.delete(jobId);
    } else {
      await SavedJobsCollection().doc(`${tradespersonId}_${jobId}`).delete();
    }

    return NextResponse.json(
      { message: "Saved job removed successfully" },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { message: err.issues[0]?.message ?? "Invalid body" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
    console.error("Error removing saved job:", err);
    return NextResponse.json(
      { message: "Failed to remove saved job" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function GET() {
  try {
    const session = await requireSession();
    if (session.user.role !== "tradesperson") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
    }

    // (Optional) Enforce tier for listing too
    const tierErr = await requireProOrBusiness(session.user.id, session.user.subscriptionTier);
    if (tierErr) return tierErr;

    const tradespersonId = session.user.id;
    let savedJobIds: string[] = [];

    if (config.isMockMode) {
      const s = store();
      savedJobIds = s.has(tradespersonId) ? Array.from(s.get(tradespersonId)!) : [];
    } else {
      const snapshot = await SavedJobsCollection().where("tradespersonId", "==", tradespersonId).get();
      type SavedJobDoc = { jobId: string };
      savedJobIds = snapshot.docs.map(d => (d.data() as SavedJobDoc).jobId);
    }

    return NextResponse.json({ savedJobs: savedJobIds }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    console.error("Error getting saved jobs:", err);
    return NextResponse.json(
      { message: "Failed to get saved jobs" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
