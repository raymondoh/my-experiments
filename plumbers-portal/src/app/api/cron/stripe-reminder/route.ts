// src/app/api/cron/stripe-reminder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { emailService } from "@/lib/email/email-service";
import { env } from "@/lib/env";

const HOURS_48_IN_MS = 48 * 60 * 60 * 1000;
const HOURS_72_IN_MS = 72 * 60 * 60 * 1000;

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function deriveName(user: {
  name?: string;
  firstName?: string;
  lastName?: string;
}): string {
  const nameParts = [user.firstName, user.lastName].filter(Boolean) as string[];
  return nameParts.join(" ").trim() || user.name || "";
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = env.STRIPE_REMINDER_CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getFirebaseAdminDb();
  const usersRef = db.collection(COLLECTIONS.USERS);
  const snapshot = await usersRef.where("role", "==", "tradesperson").get();

  const now = Date.now();
  const windowStart = new Date(now - HOURS_72_IN_MS);
  const windowEnd = new Date(now - HOURS_48_IN_MS);

  let eligible = 0;
  let remindersSent = 0;
  const failures: { id: string; error: string }[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data() as {
      email?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      createdAt?: unknown;
      stripeAccountId?: string;
      stripeOnboardingComplete?: boolean;
      stripeChargesEnabled?: boolean;
      stripeOnboardingReminderSentAt?: unknown;
    };

    if (!data?.stripeAccountId) continue;
    if (data.stripeOnboardingComplete || data.stripeChargesEnabled) continue;

    const createdAt = toDate(data.createdAt);
    if (!createdAt) continue;
    if (createdAt < windowStart || createdAt > windowEnd) continue;

    const lastReminderSentAt = toDate(data.stripeOnboardingReminderSentAt);
    if (lastReminderSentAt && lastReminderSentAt >= windowStart) continue;

    if (!data.email) continue;

    eligible += 1;
    try {
      const name = deriveName(data);
      const sent = await emailService.sendStripeOnboardingReminderEmail(data.email, name);
      if (sent) {
        remindersSent += 1;
        await doc.ref.update({
          stripeOnboardingReminderSentAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error(`Failed to send Stripe onboarding reminder for user ${doc.id}`, error);
      failures.push({ id: doc.id, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return NextResponse.json({
    processed: snapshot.size,
    eligible,
    remindersSent,
    failures: failures.length,
    failureDetails: failures
  });
}
