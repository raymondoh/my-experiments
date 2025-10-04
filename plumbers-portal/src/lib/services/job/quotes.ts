// // src/lib/services/job/quotes.ts
// import type { Quote, CreateQuoteData } from "@/lib/types/quote";
// import { JobsCollection, getAdminCollection, COLLECTIONS, getFirebaseAdminDb } from "@/lib/firebase/admin";
// import { FieldValue, Timestamp, type DocumentData, type QueryDocumentSnapshot } from "firebase-admin/firestore";
// import { notificationService } from "@/lib/services/notification-service";
// import { emailService } from "@/lib/email/email-service";
// import { userService } from "@/lib/services/user-service";
// import type { Job } from "@/lib/types/job";
// import type { User } from "@/lib/types/user";

// export async function createQuote(tradespersonId: string, data: CreateQuoteData): Promise<Quote> {
//   try {
//     const tradesperson = (await userService.getUserById(tradespersonId)) as
//       | (User & {
//           subscriptionTier?: "basic" | "pro" | "business";
//           monthlyQuotesUsed?: number;
//           quoteResetDate?: Date | string | null;
//           email?: string | null;
//         })
//       | null;
//     if (!tradesperson) {
//       throw new Error("Tradesperson not found.");
//     }

//     const tier: "basic" | "pro" | "business" = tradesperson.subscriptionTier ?? "basic";
//     const now = new Date();

//     const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
//     const quoteReset = tradesperson.quoteResetDate ? new Date(tradesperson.quoteResetDate) : undefined;
//     const needsInit = !quoteReset || Number.isNaN(quoteReset.getTime());

//     if (needsInit) {
//       await userService.updateUser(tradespersonId, {
//         monthlyQuotesUsed: 0,
//         quoteResetDate: firstOfNextMonth
//       });
//       tradesperson.monthlyQuotesUsed = 0;
//       tradesperson.quoteResetDate = firstOfNextMonth;
//     }

//     if (tradesperson.quoteResetDate && now >= new Date(tradesperson.quoteResetDate)) {
//       await userService.updateUser(tradespersonId, {
//         monthlyQuotesUsed: 0,
//         quoteResetDate: firstOfNextMonth
//       });
//       tradesperson.monthlyQuotesUsed = 0;
//       tradesperson.quoteResetDate = firstOfNextMonth;
//     }

//     if (tier === "basic") {
//       const quoteLimit = 5;
//       const used = tradesperson.monthlyQuotesUsed || 0;
//       if (used >= quoteLimit) {
//         throw new Error(
//           `quote limit: You've reached your monthly quote limit (${quoteLimit}/${quoteLimit}). ` +
//             `Upgrade to Pro for unlimited quotes.`
//         );
//       }
//     }

//     const jobRef = JobsCollection().doc(data.jobId);
//     const quoteRef = jobRef.collection("quotes").doc();

//     const quoteData: any = {
//       ...data,
//       tradespersonId,
//       tradespersonName: tradesperson.name,
//       tradespersonPhone: tradesperson.phone,
//       status: "pending" as const,
//       createdAt: now,
//       updatedAt: now
//     };

//     if (!quoteData.depositAmount || quoteData.depositAmount <= 0) {
//       delete quoteData.depositAmount;
//     }

//     await quoteRef.set(quoteData);

//     if (tier === "basic") {
//       await userService.updateUser(tradespersonId, {
//         monthlyQuotesUsed: (tradesperson.monthlyQuotesUsed || 0) + 1
//       });
//     }

//     await jobRef.update({
//       quoteCount: FieldValue.increment(1),
//       updatedAt: now
//     });

//     const jobSnap = await jobRef.get();
//     const jobData = jobSnap.data() as (Job & DocumentData) | undefined;
//     if (jobSnap.exists && jobData?.customerId) {
//       const chatRef = getAdminCollection(COLLECTIONS.CHATS).doc(data.jobId);
//       await chatRef.set(
//         {
//           jobId: data.jobId,
//           customerId: jobData.customerId,
//           tradespersonId,
//           createdAt: now
//         },
//         { merge: true }
//       );

//       await notificationService.createNotification(jobData.customerId, "new_quote", "New quote received", {
//         jobId: data.jobId,
//         quoteId: quoteRef.id
//       });

//       const customer = await userService.getUserById(jobData.customerId);
//       if (customer?.email) {
//         await emailService.sendNewQuoteEmail(customer.email, data.jobId, quoteRef.id);
//       }
//     }

//     const createdQuote: Quote = { id: quoteRef.id, ...quoteData };
//     return createdQuote;
//   } catch (error) {
//     console.error("Error creating quote:", error);
//     if (error instanceof Error) throw error;
//     throw new Error("Failed to create quote");
//   }
// }

// function parseDate(value: unknown): Date {
//   if (value instanceof Timestamp) return value.toDate();
//   if (value instanceof Date) return value;
//   if (typeof value === "string") {
//     const parsed = new Date(value);
//     if (!Number.isNaN(parsed.getTime())) {
//       return parsed;
//     }
//   }
//   return new Date();
// }

// function parseOptionalDate(value: unknown): Date | undefined {
//   if (!value) return undefined;
//   if (value instanceof Timestamp) return value.toDate();
//   if (value instanceof Date) return value;
//   if (typeof value === "string") {
//     const parsed = new Date(value);
//     return Number.isNaN(parsed.getTime()) ? undefined : parsed;
//   }
//   return undefined;
// }

// function normalizeDeposit(value: unknown): number | undefined {
//   if (typeof value === "number") {
//     return Number.isNaN(value) || value <= 0 ? undefined : value;
//   }
//   if (typeof value === "string" && value.trim().length > 0) {
//     const parsed = Number(value);
//     return Number.isNaN(parsed) || parsed <= 0 ? undefined : parsed;
//   }
//   return undefined;
// }

// function mapQuoteDocument(doc: QueryDocumentSnapshot<DocumentData>): Quote {
//   const data = doc.data();

//   const jobIdFromDoc = doc.ref.parent.parent?.id ?? "";
//   const rawPrice = data.price;
//   const price = typeof rawPrice === "number" ? rawPrice : Number(rawPrice) || 0;

//   return {
//     id: doc.id,
//     jobId: typeof data.jobId === "string" && data.jobId.length > 0 ? (data.jobId as string) : jobIdFromDoc,
//     tradespersonId: data.tradespersonId as string,
//     tradespersonName: typeof data.tradespersonName === "string" && data.tradespersonName.length > 0 ? data.tradespersonName : "N/A",
//     tradespersonPhone:
//       typeof data.tradespersonPhone === "string" && data.tradespersonPhone.length > 0 ? data.tradespersonPhone : "N/A",
//     price,
//     description: typeof data.description === "string" ? data.description : "",
//     estimatedDuration: typeof data.estimatedDuration === "string" ? data.estimatedDuration : "",
//     availableDate: parseDate(data.availableDate),
//     status: (data.status as Quote["status"]) || "pending",
//     depositAmount: normalizeDeposit(data.depositAmount),
//     createdAt: parseDate(data.createdAt),
//     updatedAt: parseDate(data.updatedAt),
//     acceptedDate: parseOptionalDate(data.acceptedDate)
//   };
// }

// export async function getQuotesByJobId(jobId: string): Promise<Quote[]> {
//   try {
//     const snapshot = await JobsCollection().doc(jobId).collection("quotes").orderBy("createdAt", "desc").get();

//     return snapshot.docs.map(doc => mapQuoteDocument(doc));
//   } catch (error) {
//     console.error("Error getting quotes:", error);
//     throw new Error("Failed to get quotes");
//   }
// }

// export async function getQuotesByTradespersonId(tradespersonId: string): Promise<Quote[]> {
//   try {
//     const jobsSnapshot = await JobsCollection().get();
//     const allQuotes: (Quote & { acceptedDate?: Date })[] = [];

//     for (const jobDoc of jobsSnapshot.docs) {
//       const quotesSnapshot = await jobDoc.ref
//         .collection("quotes")
//         .where("tradespersonId", "==", tradespersonId)
//         .orderBy("createdAt", "desc")
//         .get();

//       quotesSnapshot.docs.forEach(doc => {
//         allQuotes.push(mapQuoteDocument(doc));
//       });
//     }

//     return allQuotes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
//   } catch (error) {
//     console.error("Error getting quotes by tradesperson:", error);
//     throw new Error("Failed to get quotes");
//   }
// }

// export async function getAllQuotes(): Promise<Quote[]> {
//   try {
//     const db = getFirebaseAdminDb();
//     const quotesSnapshot = await db.collectionGroup("quotes").get();
//     if (quotesSnapshot.empty) return [];

//     return quotesSnapshot.docs.map(doc => mapQuoteDocument(doc));
//   } catch (error) {
//     console.error("Error getting all quotes:", error);
//     throw new Error("Failed to get all quotes");
//   }
// }

// export async function acceptQuote(jobId: string, quoteId: string, customerId: string): Promise<void> {
//   const db = getFirebaseAdminDb();
//   const jobRef = getAdminCollection(COLLECTIONS.JOBS).doc(jobId);
//   const quoteRef = jobRef.collection("quotes").doc(quoteId);

//   try {
//     // Using a transaction to ensure all database updates succeed or fail together.
//     await db.runTransaction(async transaction => {
//       const jobDoc = await transaction.get(jobRef);
//       const quoteDoc = await transaction.get(quoteRef);

//       if (!jobDoc.exists || !quoteDoc.exists) {
//         throw new Error("Job or quote not found.");
//       }

//       const jobData = jobDoc.data() as Job;
//       const quoteData = quoteDoc.data() as Quote;

//       // Authorization and validation checks
//       if (jobData.customerId !== customerId) {
//         throw new Error("Forbidden: You can only accept quotes for your own jobs.");
//       }
//       if (jobData.status !== "open" && jobData.status !== "quoted") {
//         throw new Error("This job is no longer open for quotes.");
//       }

//       // Add updates to the transaction
//       transaction.update(jobRef, {
//         status: "assigned",
//         tradespersonId: quoteData.tradespersonId,
//         acceptedQuoteId: quoteId,
//         updatedAt: new Date()
//       });

//       transaction.update(quoteRef, {
//         status: "accepted",
//         acceptedDate: new Date(),
//         updatedAt: new Date()
//       });
//     });

//     // --- Corrected Notification and Email Logic ---
//     // This runs only after the transaction has successfully completed.
//     const jobData = (await jobRef.get()).data() as Job;
//     const quoteData = (await quoteRef.get()).data() as Quote;

//     const tradesperson = await userService.getUserById(quoteData.tradespersonId);
//     const customer = await userService.getUserById(customerId);

//     // 1. Notify the Tradesperson that they won the job.
//     if (tradesperson?.email) {
//       await notificationService.createNotification(
//         tradesperson.id,
//         "quote_accepted",
//         `Your quote for "${jobData.title}" was accepted!`,
//         { jobId }
//       );
//       await emailService.sendQuoteAcceptedEmail(tradesperson.email, jobId, quoteId);
//     }

//     // 2. Notify the Customer that their action was successful.
//     if (customer?.email) {
//       await notificationService.createNotification(
//         customer.id,
//         "action_success",
//         `You have accepted a quote for "${jobData.title}".`,
//         { jobId }
//       );
//       // Ensure the customer also receives a confirmation email
//       await emailService.sendJobAcceptedEmail(customer.email, jobId);
//     }
//   } catch (error) {
//     console.error("Error in acceptQuote function:", error);
//     // Re-throw the error so the calling component knows something went wrong.
//     throw new Error("Failed to accept the quote. Please try again.");
//   }
// }

// export async function markJobComplete(jobId: string, tradespersonId: string): Promise<void> {
//   try {
//     const jobRef = JobsCollection().doc(jobId);
//     const jobDoc = await jobRef.get();
//     const jobData = jobDoc.data() as Job | undefined;
//     if (!jobDoc.exists || jobData?.tradespersonId !== tradespersonId) {
//       throw new Error("Unauthorized");
//     }

//     await jobRef.update({
//       status: "completed",
//       completedDate: new Date(),
//       updatedAt: new Date()
//     });
//     await notificationService.createNotification(jobData.customerId, "job_completed", "Job marked complete", {
//       jobId
//     });
//     const customer = await userService.getUserById(jobData.customerId);
//     if (customer?.email) {
//       await emailService.sendJobCompleteEmail(customer.email, jobId);
//     }
//   } catch (error) {
//     console.error("Error marking job complete:", error);
//     throw new Error("Failed to complete job");
//   }
// }
// src/lib/services/job/quotes.ts
import type { Quote, CreateQuoteData } from "@/lib/types/quote";
import { JobsCollection, getAdminCollection, COLLECTIONS, getFirebaseAdminDb } from "@/lib/firebase/admin";
import { FieldValue, Timestamp, type DocumentData, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { notificationService } from "@/lib/services/notification-service";
import { emailService } from "@/lib/email/email-service";
import { userService } from "@/lib/services/user-service";
import type { Job } from "@/lib/types/job";
import type { User } from "@/lib/types/user";

export async function createQuote(tradespersonId: string, data: CreateQuoteData): Promise<Quote> {
  try {
    const tradesperson = (await userService.getUserById(tradespersonId)) as
      | (User & {
          subscriptionTier?: "basic" | "pro" | "business";
          monthlyQuotesUsed?: number;
          quoteResetDate?: Date | string | null;
          email?: string | null;
        })
      | null;
    if (!tradesperson) {
      throw new Error("Tradesperson not found.");
    }

    const tier: "basic" | "pro" | "business" = tradesperson.subscriptionTier ?? "basic";
    const now = new Date();

    const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const quoteReset = tradesperson.quoteResetDate ? new Date(tradesperson.quoteResetDate) : undefined;
    const needsInit = !quoteReset || Number.isNaN(quoteReset.getTime());

    if (needsInit) {
      await userService.updateUser(tradespersonId, {
        monthlyQuotesUsed: 0,
        quoteResetDate: firstOfNextMonth
      });
      tradesperson.monthlyQuotesUsed = 0;
      tradesperson.quoteResetDate = firstOfNextMonth;
    }

    if (tradesperson.quoteResetDate && now >= new Date(tradesperson.quoteResetDate)) {
      await userService.updateUser(tradespersonId, {
        monthlyQuotesUsed: 0,
        quoteResetDate: firstOfNextMonth
      });
      tradesperson.monthlyQuotesUsed = 0;
      tradesperson.quoteResetDate = firstOfNextMonth;
    }

    if (tier === "basic") {
      const quoteLimit = 5;
      const used = tradesperson.monthlyQuotesUsed || 0;
      if (used >= quoteLimit) {
        throw new Error(
          `quote limit: You've reached your monthly quote limit (${quoteLimit}/${quoteLimit}). ` +
            `Upgrade to Pro for unlimited quotes.`
        );
      }
    }

    const jobRef = JobsCollection().doc(data.jobId);
    const quoteRef = jobRef.collection("quotes").doc();

    const quoteData: any = {
      ...data,
      tradespersonId,
      tradespersonName: tradesperson.name,
      tradespersonPhone: tradesperson.phone,
      status: "pending" as const,
      createdAt: now,
      updatedAt: now
    };

    if (!quoteData.depositAmount || quoteData.depositAmount <= 0) {
      delete quoteData.depositAmount;
    }

    await quoteRef.set(quoteData);

    if (tier === "basic") {
      await userService.updateUser(tradespersonId, {
        monthlyQuotesUsed: (tradesperson.monthlyQuotesUsed || 0) + 1
      });
    }

    await jobRef.update({
      quoteCount: FieldValue.increment(1),
      updatedAt: now
    });

    const jobSnap = await jobRef.get();
    const jobData = jobSnap.data() as (Job & DocumentData) | undefined;
    if (jobSnap.exists && jobData?.customerId) {
      const chatRef = getAdminCollection(COLLECTIONS.CHATS).doc(data.jobId);
      await chatRef.set(
        {
          jobId: data.jobId,
          customerId: jobData.customerId,
          tradespersonId,
          createdAt: now
        },
        { merge: true }
      );

      await notificationService.createNotification(jobData.customerId, "new_quote", "New quote received", {
        jobId: data.jobId,
        quoteId: quoteRef.id
      });

      const customer = await userService.getUserById(jobData.customerId);
      if (customer?.email) {
        await emailService.sendNewQuoteEmail(customer.email, data.jobId, quoteRef.id);
      }
    }

    const createdQuote: Quote = { id: quoteRef.id, ...quoteData };
    return createdQuote;
  } catch (error) {
    console.error("Error creating quote:", error);
    if (error instanceof Error) throw error;
    throw new Error("Failed to create quote");
  }
}

function parseDate(value: unknown): Date {
  // --- THIS IS THE FIX ---
  // Check if the value is an object before using 'instanceof'
  if (typeof value === "object" && value !== null) {
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
  }
  // --- END OF FIX ---
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

function parseOptionalDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  // --- THIS IS THE FIX ---
  // Check if the value is an object before using 'instanceof'
  if (typeof value === "object" && value !== null) {
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
  }
  // --- END OF FIX ---
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}

function normalizeDeposit(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isNaN(value) || value <= 0 ? undefined : value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isNaN(parsed) || parsed <= 0 ? undefined : parsed;
  }
  return undefined;
}

function mapQuoteDocument(doc: QueryDocumentSnapshot<DocumentData>): Quote {
  const data = doc.data();

  const jobIdFromDoc = doc.ref.parent.parent?.id ?? "";
  const rawPrice = data.price;
  const price = typeof rawPrice === "number" ? rawPrice : Number(rawPrice) || 0;

  return {
    id: doc.id,
    jobId: typeof data.jobId === "string" && data.jobId.length > 0 ? (data.jobId as string) : jobIdFromDoc,
    tradespersonId: data.tradespersonId as string,
    tradespersonName:
      typeof data.tradespersonName === "string" && data.tradespersonName.length > 0 ? data.tradespersonName : "N/A",
    tradespersonPhone:
      typeof data.tradespersonPhone === "string" && data.tradespersonPhone.length > 0 ? data.tradespersonPhone : "N/A",
    price,
    description: typeof data.description === "string" ? data.description : "",
    estimatedDuration: typeof data.estimatedDuration === "string" ? data.estimatedDuration : "",
    availableDate: parseDate(data.availableDate),
    status: (data.status as Quote["status"]) || "pending",
    depositAmount: normalizeDeposit(data.depositAmount),
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
    acceptedDate: parseOptionalDate(data.acceptedDate)
  };
}

export async function getQuotesByJobId(jobId: string): Promise<Quote[]> {
  try {
    const snapshot = await JobsCollection().doc(jobId).collection("quotes").orderBy("createdAt", "desc").get();

    return snapshot.docs.map(doc => mapQuoteDocument(doc));
  } catch (error) {
    console.error("Error getting quotes:", error);
    throw new Error("Failed to get quotes");
  }
}

export async function getQuotesByTradespersonId(tradespersonId: string): Promise<Quote[]> {
  try {
    const jobsSnapshot = await JobsCollection().get();
    const allQuotes: (Quote & { acceptedDate?: Date })[] = [];

    for (const jobDoc of jobsSnapshot.docs) {
      const quotesSnapshot = await jobDoc.ref
        .collection("quotes")
        .where("tradespersonId", "==", tradespersonId)
        .orderBy("createdAt", "desc")
        .get();

      quotesSnapshot.docs.forEach(doc => {
        allQuotes.push(mapQuoteDocument(doc));
      });
    }

    return allQuotes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error("Error getting quotes by tradesperson:", error);
    throw new Error("Failed to get quotes");
  }
}

export async function getAllQuotes(): Promise<Quote[]> {
  try {
    const db = getFirebaseAdminDb();
    const quotesSnapshot = await db.collectionGroup("quotes").get();
    if (quotesSnapshot.empty) return [];

    return quotesSnapshot.docs.map(doc => mapQuoteDocument(doc));
  } catch (error) {
    console.error("Error getting all quotes:", error);
    throw new Error("Failed to get all quotes");
  }
}

export async function acceptQuote(jobId: string, quoteId: string, customerId: string): Promise<void> {
  const db = getFirebaseAdminDb();
  const jobRef = getAdminCollection(COLLECTIONS.JOBS).doc(jobId);
  const quoteRef = jobRef.collection("quotes").doc(quoteId);

  try {
    // Using a transaction to ensure all database updates succeed or fail together.
    await db.runTransaction(async transaction => {
      const jobDoc = await transaction.get(jobRef);
      const quoteDoc = await transaction.get(quoteRef);

      if (!jobDoc.exists || !quoteDoc.exists) {
        throw new Error("Job or quote not found.");
      }

      const jobData = jobDoc.data() as Job;
      const quoteData = quoteDoc.data() as Quote;

      // Authorization and validation checks
      if (jobData.customerId !== customerId) {
        throw new Error("Forbidden: You can only accept quotes for your own jobs.");
      }
      if (jobData.status !== "open" && jobData.status !== "quoted") {
        throw new Error("This job is no longer open for quotes.");
      }

      // Add updates to the transaction
      transaction.update(jobRef, {
        status: "assigned",
        tradespersonId: quoteData.tradespersonId,
        acceptedQuoteId: quoteId,
        updatedAt: new Date()
      });

      transaction.update(quoteRef, {
        status: "accepted",
        acceptedDate: new Date(),
        updatedAt: new Date()
      });
    });

    // --- Corrected Notification and Email Logic ---
    // This runs only after the transaction has successfully completed.
    const jobData = (await jobRef.get()).data() as Job;
    const quoteData = (await quoteRef.get()).data() as Quote;

    const tradesperson = await userService.getUserById(quoteData.tradespersonId);
    const customer = await userService.getUserById(customerId);

    // 1. Notify the Tradesperson that they won the job.
    if (tradesperson?.email) {
      await notificationService.createNotification(
        tradesperson.id,
        "quote_accepted",
        `Your quote for "${jobData.title}" was accepted!`,
        { jobId }
      );
      await emailService.sendQuoteAcceptedEmail(tradesperson.email, jobId, quoteId);
    }

    // 2. Notify the Customer that their action was successful.
    if (customer?.email) {
      await notificationService.createNotification(
        customer.id,
        "action_success",
        `You have accepted a quote for "${jobData.title}".`,
        { jobId }
      );
      // Ensure the customer also receives a confirmation email
      await emailService.sendJobAcceptedEmail(customer.email, jobId);
    }
  } catch (error) {
    console.error("Error in acceptQuote function:", error);
    // Re-throw the error so the calling component knows something went wrong.
    throw new Error("Failed to accept the quote. Please try again.");
  }
}

export async function markJobComplete(jobId: string, tradespersonId: string): Promise<void> {
  try {
    const jobRef = JobsCollection().doc(jobId);
    const jobDoc = await jobRef.get();
    const jobData = jobDoc.data() as Job | undefined;
    if (!jobDoc.exists || jobData?.tradespersonId !== tradespersonId) {
      throw new Error("Unauthorized");
    }

    await jobRef.update({
      status: "completed",
      completedDate: new Date(),
      updatedAt: new Date()
    });
    await notificationService.createNotification(jobData.customerId, "job_completed", "Job marked complete", {
      jobId
    });
    const customer = await userService.getUserById(jobData.customerId);
    if (customer?.email) {
      await emailService.sendJobCompleteEmail(customer.email, jobId);
    }
  } catch (error) {
    console.error("Error marking job complete:", error);
    throw new Error("Failed to complete job");
  }
}
