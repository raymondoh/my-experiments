import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { startOfMonth } from "date-fns";
import { requireSession } from "@/lib/auth/require-session";
import { jobService } from "@/lib/services/job-service";
import type { Tier } from "@/lib/auth/require-tier";
import { standardRateLimiter } from "@/lib/rate-limiter";

const BASIC_MONTHLY_QUOTE_LIMIT = 5;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const quoteSchema = z.object({
  jobId: z.string().min(1),
  price: z.coerce.number().positive(),
  depositAmount: z.coerce.number().positive().optional(), // <-- ADDED
  description: z.string().min(10),
  estimatedDuration: z.string().min(1),
  availableDate: z.coerce.date()
});

// Coerce Firestore Timestamp | string | number | Date -> Date
type FirestoreTimestamp = { toDate: () => Date } | { seconds: number };
function toDate(value: Date | FirestoreTimestamp | number | string | null | undefined): Date {
  if (value instanceof Date) return value;
  if (value && typeof (value as { toDate?: () => Date }).toDate === "function")
    return (value as { toDate: () => Date }).toDate();
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") return new Date(value);
  if (value && typeof (value as { seconds?: number }).seconds === "number")
    return new Date((value as { seconds: number }).seconds * 1000);
  return new Date();
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await standardRateLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429, headers: NO_STORE_HEADERS });
  }

  try {
    // requireSession() provides the fresh, enriched session with the latest role and tier.
    const session = await requireSession();

    const role = session.user.role;
    const tier = (session.user.subscriptionTier ?? "basic") as Tier;

    if (role !== "tradesperson") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
    }

    // Parse payload early
    const parsed = quoteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: parsed.error.issues },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
    const { jobId, price, depositAmount, description, estimatedDuration, availableDate } = parsed.data;

    // Validate job
    const job = await jobService.getJobById(jobId);
    if (!job) return NextResponse.json({ message: "Job not found" }, { status: 404, headers: NO_STORE_HEADERS });
    if (job.status !== "open") {
      return NextResponse.json({ message: "Job is not open for quotes" }, { status: 400, headers: NO_STORE_HEADERS });
    }

    // ----- Plan limits (server-authoritative) -----
    if (tier === "basic") {
      const quotes = await jobService.getQuotesByTradespersonId(session.user.id);
      const monthStart = startOfMonth(new Date());
      const usedThisMonth = quotes.filter(q => toDate(q.createdAt) >= monthStart).length;

      if (usedThisMonth >= BASIC_MONTHLY_QUOTE_LIMIT) {
        return NextResponse.json(
          {
            code: "quote_limit",
            message: `You've reached your monthly quote limit on the Basic plan (${BASIC_MONTHLY_QUOTE_LIMIT}/month).`,
            used: usedThisMonth,
            limit: BASIC_MONTHLY_QUOTE_LIMIT,
            tier
          },
          { status: 403, headers: NO_STORE_HEADERS }
        );
      }
    }
    // Pro/Business: unlimited

    // Create quote
    const quote = await jobService.createQuote(session.user.id, {
      jobId,
      price,
      depositAmount,
      description,
      estimatedDuration,
      availableDate
    });

    return NextResponse.json(
      { message: "Quote submitted successfully", quoteId: quote.id },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Error submitting quote:", error);

    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("quote limit")) {
      // In case the service also enforces and throws
      return NextResponse.json({ code: "quote_limit", message: msg }, { status: 403, headers: NO_STORE_HEADERS });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "Invalid request" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json({ message: "Failed to submit quote" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
