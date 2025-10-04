// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import type Stripe from "stripe";
import { UsersCollection, JobsCollection, getFirebaseAdminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { userService } from "@/lib/services/user-service";
import { emailService } from "@/lib/email/email-service";
import type { PaymentStatus } from "@/lib/types/job";
import { Tier, asTier } from "@/lib/subscription/tier";
import type { SubscriptionStatus, UpdateUserData } from "@/lib/types/user";

// ... (helper functions remain the same) ...
/* -------------------- Subscription tier helpers -------------------- */

const PRICE_TO_TIER: Record<string, "pro" | "business"> = [
  process.env.STRIPE_PRO_PRICE_ID,
  process.env.STRIPE_PRO_PRICE_ID_YEARLY,
  process.env.STRIPE_BUSINESS_PRICE_ID,
  process.env.STRIPE_BUSINESS_PRICE_ID_YEARLY
]
  .filter(Boolean)
  .reduce<Record<string, "pro" | "business">>((acc, id) => {
    const val = String(id);
    if (val === process.env.STRIPE_PRO_PRICE_ID || val === process.env.STRIPE_PRO_PRICE_ID_YEARLY) acc[val] = "pro";
    if (val === process.env.STRIPE_BUSINESS_PRICE_ID || val === process.env.STRIPE_BUSINESS_PRICE_ID_YEARLY)
      acc[val] = "business";
    return acc;
  }, {});

/* -------------------- Firestore write helper -------------------- */
async function writeWithRetry(action: () => Promise<any>, description: string, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await action();
      return;
    } catch (err) {
      if (i === attempts) {
        console.error(`Firestore write failed for ${description}`, err);
        if (process.env.ALERT_WEBHOOK_URL) {
          try {
            await fetch(process.env.ALERT_WEBHOOK_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: `Firestore write failed for ${description}` })
            });
          } catch (alertErr) {
            console.error("Alerting failed", alertErr);
          }
        }
      } else {
        await new Promise(res => setTimeout(res, 100 * i));
      }
    }
  }
}

function tierFromSubscription(sub: Stripe.Subscription): "pro" | "business" | undefined {
  const priceId = sub.items?.data?.[0]?.price?.id;
  return priceId ? PRICE_TO_TIER[priceId] : undefined;
}

async function tierFromCheckoutSession(session: Stripe.Checkout.Session): Promise<"pro" | "business" | undefined> {
  const metaTier = asTier(session.metadata?.tier);
  if (metaTier && metaTier !== "basic") return metaTier;

  try {
    const full = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items.data.price"]
    });
    const priceId = full?.line_items?.data?.[0]?.price?.id;
    return priceId ? PRICE_TO_TIER[priceId] : undefined;
  } catch {
    return undefined;
  }
}

/* -------------------- Job payment helpers -------------------- */

type QuotePaymentStatus = "authorized" | "captured" | "refunded" | "canceled";

function paymentStatusFromPI(pi: Stripe.PaymentIntent): QuotePaymentStatus | undefined {
  if (pi.status === "requires_capture" && pi.capture_method === "manual") return "authorized";
  if (pi.status === "succeeded") return "captured";
  if (pi.status === "canceled") return "canceled";
  return undefined;
}

async function updateJobQuotePaymentFromPI(pi: Stripe.PaymentIntent) {
  const { jobId, quoteId } = (pi.metadata ?? {}) as Record<string, string | undefined>;
  if (!jobId || !quoteId) return;

  const jobRef = JobsCollection().doc(jobId);
  const quoteRef = jobRef.collection("quotes").doc(quoteId);

  const status = paymentStatusFromPI(pi);
  const paymentType = (pi.metadata?.paymentType as "deposit" | "final" | undefined) ?? undefined;
  const patch: Record<string, unknown> = {
    paymentIntentId: pi.id,
    paymentAmount: pi.amount,
    paymentCurrency: pi.currency,
    paymentCaptureMethod: pi.capture_method,
    paymentStatus: status,
    updatedAt: new Date()
  };

  await writeWithRetry(() => quoteRef.set(patch, { merge: true }), "update quote payment");

  const jobPatch: Record<string, unknown> = {
    lastPaymentIntentId: pi.id,
    updatedAt: new Date()
  };

  if (!paymentType && status) {
    jobPatch.paymentStatus = status;
  }

  await writeWithRetry(() => jobRef.set(jobPatch, { merge: true }), "update job payment");
}

async function handleJobCheckoutCompleted(session: Stripe.Checkout.Session) {
  const piId = session.payment_intent as string | null;
  if (!piId) return;

  const pi = await stripe.paymentIntents.retrieve(piId);
  await updateJobQuotePaymentFromPI(pi);

  const { jobId, quoteId } = (pi.metadata ?? {}) as Record<string, string | undefined>;
  if (!jobId || !quoteId) return;

  const jobRef = JobsCollection().doc(jobId);
  const quoteRef = jobRef.collection("quotes").doc(quoteId);

  await writeWithRetry(
    () =>
      quoteRef.set(
        {
          checkoutSessionId: session.id,
          checkoutStatus: "completed",
          updatedAt: new Date()
        },
        { merge: true }
      ),
    "mark quote checkout completed"
  );

  const paymentType = session.metadata?.paymentType as ("deposit" | "final") | undefined;
  if (!paymentType) return;

  const jobSnap = await jobRef.get();
  if (!jobSnap.exists) return;

  const jobData = jobSnap.data() as {
    title?: string;
    customerContact?: { email?: string };
    tradespersonId?: string;
  };

  const paymentStatus: PaymentStatus = paymentType === "deposit" ? "deposit_paid" : "fully_paid";

  await writeWithRetry(
    () =>
      jobRef.set(
        {
          paymentStatus,
          updatedAt: new Date()
        },
        { merge: true }
      ),
    `update job ${jobId} payment status`
  );

  if (paymentType === "deposit") {
    const quoteSnap = await quoteRef.get();
    if (!quoteSnap.exists) return;

    const quoteData = quoteSnap.data() as { depositAmount?: number; tradespersonId?: string };
    const depositAmount = quoteData.depositAmount ?? 0;

    if (depositAmount <= 0) return;

    const jobTitle = jobData.title ?? "Job";
    const customerEmail = jobData.customerContact?.email;
    if (customerEmail) {
      await emailService.sendDepositPaidEmail(customerEmail, "customer", jobTitle, depositAmount);
    }

    const tradespersonId = quoteData.tradespersonId ?? jobData.tradespersonId;
    if (tradespersonId) {
      const tradesperson = await userService.getUserById(tradespersonId);
      if (tradesperson?.email) {
        await emailService.sendDepositPaidEmail(tradesperson.email, "tradesperson", jobTitle, depositAmount);
      }
    }
  }
}

function isSubscriptionCheckout(session: Stripe.Checkout.Session) {
  return session.mode === "subscription" || Boolean(session.subscription);
}
function isJobPaymentCheckout(session: Stripe.Checkout.Session) {
  return Boolean(session.metadata?.jobId && session.metadata?.quoteId);
}
async function handleSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("Webhook Error: No userId in subscription metadata");
    return;
  }

  const user = await userService.getUserById(userId);
  if (!user) {
    console.error(`Webhook Error: User not found with id ${userId}`);
    return;
  }

  const subscriptionData: UpdateUserData = {
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: asSubscriptionStatus(subscription.status),
    subscriptionTier: asTier(subscription.items.data[0]?.price.lookup_key),
    stripeCustomerId: subscription.customer as string
  };

  await userService.updateUser(userId, subscriptionData);
  console.log(`Subscription updated for user ${userId}`);
}

function asSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const validStatuses: SubscriptionStatus[] = [
    "active",
    "canceled",
    "incomplete",
    "incomplete_expired",
    "past_due",
    "trialing",
    "unpaid"
  ];
  if (validStatuses.includes(status as any)) {
    return status as SubscriptionStatus;
  }
  return null;
}

async function handleAccountUpdated(account: Stripe.Account) {
  const firestore = getFirebaseAdminDb();
  const usersRef = firestore.collection(COLLECTIONS.USERS);
  const querySnapshot = await usersRef.where("stripeConnectAccountId", "==", account.id).limit(1).get();

  if (!querySnapshot.empty) {
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as {
      email?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      stripeChargesEnabled?: boolean;
    };
    const previouslyEnabled = Boolean(userData?.stripeChargesEnabled);
    await writeWithRetry(
      () =>
        userDoc.ref.update({
          stripeOnboardingComplete: account.details_submitted,
          stripeChargesEnabled: account.charges_enabled,
          updatedAt: new Date()
        }),
      `update Stripe Connect status for user ${userDoc.id}`
    );
    console.log(`Updated user ${userDoc.id} with Stripe account status: charges_enabled=${account.charges_enabled}`);

    if (account.charges_enabled && !previouslyEnabled) {
      const nameParts = [userData?.firstName, userData?.lastName].filter(Boolean) as string[];
      const derivedName = nameParts.join(" ").trim() || userData?.name || "";
      if (userData?.email) {
        await emailService.sendStripeOnboardingSuccessEmail(userData.email, derivedName);
      }
    }
  } else {
    console.warn(`Webhook received for unknown stripeConnectAccountId: ${account.id}`);
  }
}

/* -------------------- Route handler -------------------- */

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook signature missing" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (isSubscriptionCheckout(session)) {
          const userId = (session.metadata?.userId as string | undefined) ?? undefined;
          const customerId = (session.customer as string | null) ?? null;
          let tier: Tier = asTier(session.metadata?.tier);
          if (!tier || tier === "basic") tier = (await tierFromCheckoutSession(session)) || "basic";

          if (userId && customerId) {
            const update: Record<string, unknown> = {
              stripeCustomerId: customerId,
              subscriptionStatus: "active",
              updatedAt: new Date()
            };
            if (tier) {
              update.subscriptionTier = tier;
              // --- THIS IS THE FIX ---
              // If the user buys the 'business' tier, update their role.
              if (tier === "business") {
                update.role = "business_owner";
              }
            }
            await writeWithRetry(() => UsersCollection().doc(userId).update(update), "update user after checkout");
          }
        } else if (isJobPaymentCheckout(session)) {
          await handleJobCheckoutCompleted(session);
        }

        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const metadata = (subscription.metadata ?? {}) as Record<string, string | undefined>;
        const userIdFromMetadata = metadata.userId;
        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : (subscription.customer?.id ?? null);
        const inferredTier = tierFromSubscription(subscription);
        const subscriptionStatus = asSubscriptionStatus(subscription.status);

        const update: UpdateUserData = { subscriptionStatus };
        if (customerId) {
          update.stripeCustomerId = customerId;
        }
        if (inferredTier) {
          update.subscriptionTier = inferredTier;
        }

        if (userIdFromMetadata) {
          if (inferredTier === "business") {
            update.role = "business_owner";
          } else if (inferredTier === "pro") {
            const currentUser = await userService.getUserById(userIdFromMetadata);
            if (currentUser?.role === "business_owner") {
              update.role = "tradesperson";
            }
          }

          await writeWithRetry(
            () => userService.updateUser(userIdFromMetadata, update),
            "update subscription from metadata"
          );
        } else if (customerId) {
          console.warn(
            `Stripe webhook subscription ${subscription.id} missing userId metadata; falling back to customer lookup.`
          );

          const snapshot = await UsersCollection().where("stripeCustomerId", "==", customerId).limit(1).get();
          if (!snapshot.empty) {
            const ref = snapshot.docs[0].ref;
            const fallbackUpdate: Record<string, unknown> = {
              subscriptionStatus: subscription.status,
              updatedAt: new Date()
            };

            if (inferredTier) {
              fallbackUpdate.subscriptionTier = inferredTier;
            }

            if (customerId) {
              fallbackUpdate.stripeCustomerId = customerId;
            }

            await writeWithRetry(() => ref.update(fallbackUpdate), "update subscription (fallback)");
          }
        } else {
          console.error(
            `Stripe webhook subscription ${subscription.id} is missing both user metadata and customer reference.`
          );
        }
        break;
      }
      // ... (rest of the webhook cases)
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const snapshot = await UsersCollection().where("stripeCustomerId", "==", customerId).limit(1).get();
        if (!snapshot.empty) {
          await writeWithRetry(
            () =>
              snapshot.docs[0].ref.update({
                subscriptionStatus: sub.status, // likely "canceled"
                subscriptionTier: "basic",
                updatedAt: new Date()
              }),
            "subscription canceled"
          );
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const snapshot = await UsersCollection().where("stripeCustomerId", "==", customerId).limit(1).get();
        if (!snapshot.empty) {
          await writeWithRetry(
            () =>
              snapshot.docs[0].ref.update({
                subscriptionStatus: "past_due",
                updatedAt: new Date()
              }),
            "invoice payment failed"
          );
        }
        break;
      }
      case "payment_intent.succeeded":
      case "payment_intent.canceled":
      case "payment_intent.amount_capturable_updated":
      case "payment_intent.partially_funded":
      case "payment_intent.processing": {
        const pi = event.data.object as Stripe.PaymentIntent;
        if (pi.metadata?.jobId && pi.metadata?.quoteId) {
          await updateJobQuotePaymentFromPI(pi);
        }
        break;
      }
      case "charge.refunded":
      case "charge.refund.updated": {
        const charge = event.data.object as Stripe.Charge;
        if (typeof charge.payment_intent === "string") {
          const pi = await stripe.paymentIntents.retrieve(charge.payment_intent);
          if (pi.metadata?.jobId && pi.metadata?.quoteId) {
            await updateJobQuotePaymentFromPI(pi);
          }
        }
        break;
      }
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
        break;
      }
      default:
        // Acknowledge unknown events.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error", err);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }
}
