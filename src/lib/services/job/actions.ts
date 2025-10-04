"use server";

// src/lib/services/job/actions.ts
// This file now contains the core CRUD operations for jobs.
import type {
  Job,
  JobStatus,
  JobUrgency,
  CreateJobData,
  UpdateJobData,
  JobLocation,
  PaymentStatus
} from "@/lib/types/job";

import { JobsCollection } from "@/lib/firebase/admin";
import { geocodingService } from "../geocoding-service";
import { FieldPath, type DocumentData } from "firebase-admin/firestore";
import { findMatchingTradespeople } from "@/lib/services/user/actions";
import { notificationService } from "@/lib/services/notification-service";
import { emailService } from "@/lib/email/email-service";

// Create a set of lowercase tokens used for keyword searching
function generateJobKeywords(data: {
  title?: string;
  description?: string;
  serviceType?: string;
  location?: JobLocation;
  skills?: string[];
}): string[] {
  const keywords = new Set<string>();
  const addWords = (text?: string) => {
    if (!text) return;
    text
      .toLowerCase()
      .split(/\s+/)
      .forEach(word => keywords.add(word));
  };

  addWords(data.title);
  addWords(data.description);
  addWords(data.serviceType);
  addWords(data.location?.postcode);
  addWords(data.location?.address);
  data.skills?.forEach(addWords);

  return Array.from(keywords).filter(Boolean);
}

export async function createJob(data: CreateJobData): Promise<Job> {
  try {
    const jobsCollection = JobsCollection();

    let locationData: JobLocation = typeof data.location === "string" ? { postcode: data.location } : data.location;
    const geoResult = await geocodingService.getCoordinatesFromPostcode(locationData.postcode);

    if (geoResult) {
      locationData = {
        ...locationData,
        latitude: geoResult.coordinates.latitude,
        longitude: geoResult.coordinates.longitude
      };
    }

    const jobData: Omit<Job, "id"> & { searchKeywords: string[] } = {
      ...(data as Omit<Job, "id">),
      location: locationData,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
      quoteCount: 0,
      isFromOnboarding: data.isFromOnboarding ?? false,
      searchKeywords: generateJobKeywords({
        title: data.title,
        description: data.description,
        serviceType: data.serviceType,
        location: locationData,
        skills: (data as unknown as { skills?: string[] }).skills
      })
    };

    const removeUndefined = (obj: Record<string, unknown>): void => {
      Object.keys(obj).forEach(key => {
        const value = obj[key as keyof typeof obj];
        if (value === undefined) {
          delete obj[key as keyof typeof obj];
        } else if (typeof value === "object" && value !== null) {
          removeUndefined(value as Record<string, unknown>);
        }
      });
    };
    removeUndefined(jobData as unknown as Record<string, unknown>);

    const docRef = await jobsCollection.add(jobData);
    const newJob = { ...jobData, id: docRef.id } as Job;

    try {
      const matchedTradespeople = await findMatchingTradespeople(newJob);
      for (const tradesperson of matchedTradespeople) {
        await notificationService.createNotification(
          tradesperson.id,
          "new_job_alert",
          `A new job matching your skills has been posted: "${newJob.title}"`,
          { jobId: newJob.id }
        );

        if (tradesperson.email) {
          await emailService.sendNewJobAlertEmail(tradesperson.email, newJob);
        }
      }
    } catch (error) {
      console.error("Failed to send job alerts:", error);
    }

    return newJob;
  } catch (error: unknown) {
    console.error("Error creating job:", error);
    throw new Error("Failed to create job");
  }
}

export async function getJobById(id: string): Promise<Job | null> {
  try {
    const doc = await JobsCollection().doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data() as DocumentData;
    return {
      ...data,
      id: doc.id,
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
      scheduledDate: data?.scheduledDate?.toDate() || null,
      completedDate: data?.completedDate?.toDate() || null,
      tradespersonId: data?.tradespersonId,
      reviewId: data.reviewId || null,
      paymentStatus: data.paymentStatus as PaymentStatus | null | undefined
    } as Job;
  } catch (error) {
    console.error("Error getting job:", error);
    throw new Error("Failed to get job");
  }
}

export async function getJobsByCustomer(customerId: string): Promise<Job[]> {
  try {
    const snapshot = await JobsCollection().where("customerId", "==", customerId).orderBy("createdAt", "desc").get();

    return snapshot.docs.map(doc => {
      const data = doc.data() as DocumentData;
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        scheduledDate: data.scheduledDate?.toDate() || null,
        tradespersonId: data.tradespersonId
      } as Job;
    });
  } catch (error) {
    console.error("Error getting jobs by customer:", error);
    throw new Error("Failed to get jobs");
  }
}

export async function getPaginatedJobs({
  limit = 6,
  lastVisibleId = null
}: {
  limit?: number;
  lastVisibleId?: string | null;
}): Promise<{
  jobs: Job[];
  lastVisibleId: string | null;
  totalJobCount: number;
}> {
  try {
    const jobsCollection = JobsCollection();
    let query = jobsCollection.orderBy(FieldPath.documentId()).limit(limit);
    if (lastVisibleId) {
      const lastVisibleDoc = await jobsCollection.doc(lastVisibleId).get();
      if (lastVisibleDoc.exists) {
        query = query.startAfter(lastVisibleDoc);
      }
    }

    const [snapshot, countSnap] = await Promise.all([query.get(), jobsCollection.count().get()]);

    const jobs = snapshot.docs.map(doc => {
      const data = doc.data() as DocumentData;
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        scheduledDate: data.scheduledDate?.toDate() || null,
        completedDate: data.completedDate?.toDate() || null,
        tradespersonId: data.tradespersonId
      } as Job;
    });

    const nextCursor = snapshot.size === limit ? snapshot.docs[snapshot.docs.length - 1].id : null;

    return {
      jobs,
      lastVisibleId: nextCursor,
      totalJobCount: countSnap.data().count
    };
  } catch (error) {
    console.error("JobService: getPaginatedJobs error:", error);
    throw new Error("Failed to fetch paginated jobs");
  }
}

export async function getAllJobs(): Promise<Job[]> {
  try {
    const snapshot = await JobsCollection().orderBy("createdAt", "desc").get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => {
      const data = doc.data() as DocumentData;
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        scheduledDate: data.scheduledDate?.toDate() || null,
        tradespersonId: data.tradespersonId
      } as Job;
    });
  } catch (error) {
    console.error("Error getting all jobs:", error);
    throw new Error("Failed to get all jobs");
  }
}

export async function getTotalJobCount(): Promise<number> {
  try {
    const jobsCollection = JobsCollection();
    const countSnap = await jobsCollection.count().get();
    return countSnap.data().count;
  } catch (error) {
    console.error("JobService: getTotalJobCount error:", error);
    throw new Error("Failed to get total job count");
  }
}

export async function getJobCountByStatus(status: JobStatus): Promise<number> {
  try {
    const jobsCollection = JobsCollection();
    const countSnap = await jobsCollection.where("status", "==", status).count().get();
    return countSnap.data().count;
  } catch (error) {
    console.error("JobService: getJobCountByStatus error:", error);
    throw new Error("Failed to get job count by status");
  }
}

export async function getOpenJobs(): Promise<Job[]> {
  try {
    console.log("[LOG] Attempting to fetch open jobs...");
    // Removed Firestore orderBy to avoid missing index issues
    const snapshot = await JobsCollection().where("status", "==", "open").get();

    const jobs = snapshot.docs.map(doc => {
      const data = doc.data() as DocumentData;
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        scheduledDate: data.scheduledDate?.toDate() || null,
        tradespersonId: data.tradespersonId
      } as Job;
    });

    // Sort jobs by createdAt in memory to preserve expected order
    jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    console.log(`[LOG] Firestore query for open jobs returned ${jobs.length} documents.`);
    return jobs;
  } catch (error) {
    console.error("Error getting open jobs:", error);
    throw new Error("Failed to get open jobs");
  }
}

export async function getRecentOpenJobs(limit: number): Promise<Job[]> {
  try {
    const snapshot = await JobsCollection()
      .where("status", "==", "open")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data() as DocumentData;
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        scheduledDate: data.scheduledDate?.toDate() || null,
        tradespersonId: data.tradespersonId
      } as Job;
    });
  } catch (error) {
    console.error("Error getting recent open jobs:", error);
    throw new Error("Failed to get recent open jobs");
  }
}

export async function updateJob(id: string, data: UpdateJobData): Promise<Job> {
  try {
    const updateData: Partial<UpdateJobData> & { updatedAt: Date } = {
      ...data,
      updatedAt: new Date()
    };
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    await JobsCollection().doc(id).update(updateData);
    const updated = await getJobById(id);
    if (!updated) throw new Error("Job not found");
    return updated;
  } catch (error) {
    console.error("Error updating job:", error);
    throw new Error("Failed to update job");
  }
}

export async function updateJobStatus(id: string, status: JobStatus): Promise<void> {
  try {
    await JobsCollection().doc(id).update({
      status,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error("Error updating job status:", error);
    throw new Error("Failed to update job status");
  }
}

export async function deleteJob(id: string): Promise<void> {
  try {
    await JobsCollection().doc(id).delete();
  } catch (error) {
    console.error("Error deleting job:", error);
    throw new Error("Failed to delete job");
  }
}
