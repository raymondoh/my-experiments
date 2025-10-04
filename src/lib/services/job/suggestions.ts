// src/lib/services/job/suggestions.ts
import { JobsCollection } from "@/lib/firebase/admin";
import type { Job } from "@/lib/types/job";

export type SuggestionJob = Pick<Job, "title" | "serviceType" | "location">;

export async function getJobsForSuggestions(limit: number): Promise<SuggestionJob[]> {
  try {
    const snapshot = await JobsCollection()
      .where("status", "==", "open")
      .select("title", "serviceType", "location")
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data() as Record<string, any>;
      return {
        title: data.title ?? "",
        serviceType: data.serviceType,
        location: { postcode: data.location?.postcode ?? "" }
      } as SuggestionJob;
    });
  } catch (error) {
    console.error("Error fetching job suggestions:", error);
    throw new Error("Failed to fetch job suggestions");
  }
}

