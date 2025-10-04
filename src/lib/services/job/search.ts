// src/lib/services/job/search.ts
// This new file now contains all the logic related to searching and filtering jobs
import type { Job, SearchParams, SearchResult } from "@/lib/types/job";
import { JobsCollection } from "@/lib/firebase/admin";
import { calculateDistance } from "@/lib/utils";
import { calculateRelevanceScore } from "@/lib/utils/search";

export async function searchJobs(params: SearchParams): Promise<SearchResult> {
  const {
    query,
    location,
    radius,
    urgency,
    minBudget,
    maxBudget,
    noQuotes,
    datePosted,
    skills,
    sortBy = "newest",
    page = 1,
    limit = 20
  } = params;

  // Base query - only open jobs
  // NOTE: These compound queries require appropriate composite indexes in Firestore.
  // Ensure indexes are created in the Firebase console for the combinations used here.
  let ref = JobsCollection().where("status", "==", "open");

  // Conditional filters
  if (urgency) {
    ref = ref.where("urgency", "==", urgency);
  }
  if (typeof minBudget === "number") {
    ref = ref.where("budget", ">=", minBudget);
  }
  if (typeof maxBudget === "number") {
    ref = ref.where("budget", "<=", maxBudget);
  }
  if (noQuotes) {
    ref = ref.where("quoteCount", "==", 0);
  }
  if (typeof datePosted === "number") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - datePosted);
    ref = ref.where("createdAt", ">=", cutoff);
  }
  if (skills && skills.length > 0) {
    ref = ref.where("skills", "array-contains-any", skills.slice(0, 10));
  }
  if (query && query.trim()) {
    const keywords = query.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 10);
    if (keywords.length > 0) {
      ref = ref.where("searchKeywords", "array-contains-any", keywords);
    }
  }

  // Fetch all matching documents before sorting and paginating in memory
  const snapshot = await ref.get();
  let jobs: (Job & { distance?: number; relevance?: number })[] = snapshot.docs.map(doc => {
    const data = doc.data() as Record<string, unknown> & {
      createdAt?: { toDate: () => Date };
      updatedAt?: { toDate: () => Date };
      scheduledDate?: { toDate: () => Date | null };
    };
    return {
      ...(data as Omit<Job, "id" | "createdAt" | "updatedAt" | "scheduledDate">),
      id: doc.id,
      createdAt: data.createdAt?.toDate() ?? new Date(),
      updatedAt: data.updatedAt?.toDate() ?? new Date(),
      scheduledDate: data.scheduledDate?.toDate() ?? null
    } as Job;
  });

  // Location & radius filtering (performed in memory)
  let searchLat: number | undefined;
  let searchLng: number | undefined;
  if (location) {
    const [latStr, lngStr] = location.split(",");
    const lat = Number.parseFloat(latStr);
    const lng = Number.parseFloat(lngStr);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      searchLat = lat;
      searchLng = lng;
    }
  }
  if (searchLat !== undefined && searchLng !== undefined && typeof radius === "number") {
    jobs = jobs
      .map(job => {
        const { latitude, longitude } = job.location || {};
        if (typeof latitude === "number" && typeof longitude === "number") {
          const distance = calculateDistance(searchLat!, searchLng!, latitude, longitude);
          return { ...job, distance };
        }
        return job;
      })
      .filter(job => typeof job.distance === "number" && job.distance <= radius);
  }

  // In-memory sorting based on the sortBy parameter
  switch (sortBy) {
    case "budget_high":
      jobs.sort((a, b) => (b.budget || 0) - (a.budget || 0));
      break;
    case "budget_low":
      jobs.sort((a, b) => (a.budget || 0) - (b.budget || 0));
      break;
    case "urgency":
      const urgencyOrder = { emergency: 0, urgent: 1, soon: 2, flexible: 3 };
      jobs.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
      break;
    case "distance":
      jobs.sort((a, b) => (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY));
      break;
    case "relevance":
      jobs = jobs
        .map(job => ({
          ...job,
          relevance: calculateRelevanceScore(job, query || "", skills)
        }))
        .sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
      break;
    default: // "newest"
      jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      break;
  }

  // In-memory pagination
  const totalJobs = jobs.length;
  const totalPages = Math.ceil(totalJobs / limit);
  const paginatedJobs = jobs.slice((page - 1) * limit, page * limit);

  // Counts for stats
  const [totalAvailable, emergencyJobs] = await Promise.all([
    JobsCollection()
      .where("status", "==", "open")
      .count()
      .get()
      .then(s => s.data().count),
    ref
      .where("urgency", "==", "emergency")
      .count()
      .get()
      .then(s => s.data().count)
  ]);

  const jobsResult: Job[] = paginatedJobs.map(job => {
    const { relevance, ...rest } = job;
    void relevance;
    return rest;
  });
  const avgBudget =
    jobsResult.length > 0 ? jobsResult.reduce((sum, j) => sum + (j.budget || 0), 0) / jobsResult.length : 0;

  return {
    jobs: jobsResult,
    pagination: {
      page,
      limit,
      totalJobs,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    },
    filters: {
      query: query || undefined,
      location: params.location || undefined,
      radius: params.radius,
      urgency: urgency ? [urgency] : undefined,
      minBudget,
      maxBudget,
      skills,
      noQuotes,
      datePosted,
      sortBy,
      hasActiveFilters: !!(
        query ||
        params.location ||
        params.radius ||
        urgency ||
        minBudget ||
        maxBudget ||
        skills?.length ||
        noQuotes ||
        datePosted
      )
    },
    stats: {
      totalAvailable,
      filtered: totalJobs,
      emergencyJobs,
      avgBudget
    }
  };
}
