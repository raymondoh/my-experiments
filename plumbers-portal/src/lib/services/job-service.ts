// src/lib/services/job-service.ts
import * as JobActions from "./job/actions";
import * as JobQuotes from "./job/quotes";
import * as JobSearch from "./job/search";
import * as JobSuggestions from "./job/suggestions";
import { config } from "@/lib/config/app-mode";
import type {
  Job,
  JobStatus,
  JobUrgency,
  CreateJobData,
  UpdateJobData,
  SearchParams,
  SearchResult
} from "@/lib/types/job";
import type { Quote, CreateQuoteData } from "@/lib/types/quote";
import { getFirebaseAdminDb, getAdminCollection, COLLECTIONS } from "@/lib/firebase/admin";
import { notificationService } from "@/lib/services/notification-service";
import type { SuggestionJob } from "./job/suggestions";

type Chat = { jobId: string } & Record<string, unknown>;

export interface JobService {
  createJob(data: CreateJobData): Promise<Job>;
  getJobById(id: string): Promise<Job | null>;
  getJobsByCustomer(customerId: string): Promise<Job[]>;
  getAllJobs(): Promise<Job[]>;
  getTotalJobCount(): Promise<number>;
  getJobCountByStatus(status: JobStatus): Promise<number>;
  getAllQuotes(): Promise<Quote[]>;
  getOpenJobs(): Promise<Job[]>;
  getRecentOpenJobs(limit: number): Promise<Job[]>;
  getJobsForSuggestions(limit: number): Promise<SuggestionJob[]>;
  updateJob(id: string, data: UpdateJobData): Promise<Job>;
  updateJobStatus(id: string, status: JobStatus): Promise<void>;
  deleteJob(id: string): Promise<void>;
  searchJobs(params: SearchParams): Promise<SearchResult>;
  createQuote(tradespersonId: string, data: CreateQuoteData): Promise<Quote>;
  getQuotesByJobId(jobId: string): Promise<Quote[]>;
  getQuotesByTradespersonId(tradespersonId: string): Promise<Quote[]>;
  acceptQuote(jobId: string, quoteId: string, customerId: string): Promise<void>;
  markJobComplete(jobId: string, tradespersonId: string): Promise<void>;
  adminDeleteJob(jobId: string): Promise<void>;
}

class FirebaseJobService implements JobService {
  // Actions
  createJob = JobActions.createJob;
  getJobById = JobActions.getJobById;
  getJobsByCustomer = JobActions.getJobsByCustomer;
  getAllJobs = JobActions.getAllJobs;
  getTotalJobCount = JobActions.getTotalJobCount;
  getJobCountByStatus = JobActions.getJobCountByStatus;
  getOpenJobs = JobActions.getOpenJobs;
  getRecentOpenJobs = JobActions.getRecentOpenJobs;
  getJobsForSuggestions = JobSuggestions.getJobsForSuggestions;
  updateJob = JobActions.updateJob;
  updateJobStatus = JobActions.updateJobStatus;
  deleteJob = JobActions.deleteJob;
  // Admin delete job with all associated data cleanup
  adminDeleteJob = async (jobId: string): Promise<void> => {
    const db = getFirebaseAdminDb();
    const batch = db.batch();

    const jobRef = getAdminCollection(COLLECTIONS.JOBS).doc(jobId);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists) {
      return; // Job already deleted
    }
    const jobData = jobDoc.data() as Job;

    const chatRef = getAdminCollection(COLLECTIONS.CHATS).doc(jobId);

    // --- THIS IS THE FIX ---
    // Get all documents in the 'messages' subcollection of the chat
    const chatMessagesSnapshot = await chatRef.collection("messages").get();
    // Add each message to the batch for deletion
    chatMessagesSnapshot.forEach(doc => batch.delete(doc.ref));
    // --- END OF FIX ---

    // Add all other deletions to the atomic batch operation
    const quotesSnapshot = await jobRef.collection("quotes").get();
    quotesSnapshot.forEach(doc => batch.delete(doc.ref));

    // This was deleting the messages subcollection on the JOB, not the CHAT.
    // It can be removed as the fix above handles it correctly.
    // const messagesSnapshot = await jobRef.collection("messages").get();
    // messagesSnapshot.forEach(doc => batch.delete(doc.ref));

    batch.delete(jobRef);
    batch.delete(chatRef); // This deletes the parent chat document

    await batch.commit();

    // Send notifications after the deletion is complete
    if (jobData) {
      const { customerId, tradespersonId } = jobData;
      const notificationTitle = "Job Removed by Admin";
      const notificationMessage = `The job "${jobData.title}" has been removed by an administrator.`;

      if (customerId) {
        await notificationService.createNotification(customerId, "job_removed", notificationTitle, {
          message: notificationMessage
        });
      }
      if (tradespersonId) {
        await notificationService.createNotification(tradespersonId, "job_removed", notificationTitle, {
          message: notificationMessage
        });
      }
    }
  };

  // Quotes
  createQuote = JobQuotes.createQuote;
  getQuotesByJobId = JobQuotes.getQuotesByJobId;
  getQuotesByTradespersonId = JobQuotes.getQuotesByTradespersonId;
  getAllQuotes = JobQuotes.getAllQuotes;
  acceptQuote = JobQuotes.acceptQuote;
  markJobComplete = JobQuotes.markJobComplete;

  // Search
  searchJobs = JobSearch.searchJobs;
}

// The Mock service is kept here for testing purposes, assuming it's used in your test environment.
export class MockJobService implements JobService {
  private jobs: Job[] = [];
  private quotes: Quote[] = [];
  private chats: Chat[] = []; // Mock chat data for cleanup in adminDeleteJob

  constructor() {
    this.jobs = (global as { mockJobs?: Job[] }).mockJobs || [];
    this.quotes = (global as { mockQuotes?: Quote[] }).mockQuotes || [];
    this.chats = (global as { mockChats?: Chat[] }).mockChats || [];
  }

  async createJob(data: CreateJobData): Promise<Job> {
    const id = (this.jobs.length + 1).toString();
    const job: Job = {
      id,
      customerId: data.customerId,
      title: data.title,
      description: data.description,
      urgency: data.urgency as JobUrgency,
      location: typeof data.location === "string" ? { postcode: data.location } : data.location,
      customerContact: {
        name: data.customerContact.name,
        email: data.customerContact.email,
        phone: data.customerContact.phone
      },
      status: "open",
      budget: data.budget,
      serviceType: data.serviceType,
      photos: data.photos,
      isFromOnboarding: data.isFromOnboarding || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      scheduledDate: data.scheduledDate,
      quoteCount: 0
    };

    this.jobs.push(job);
    return job;
  }

  async getJobById(id: string): Promise<Job | null> {
    return this.jobs.find(job => job.id === id) || null;
  }

  async getJobsByCustomer(customerId: string): Promise<Job[]> {
    return this.jobs.filter(job => job.customerId === customerId);
  }

  async getAllJobs(): Promise<Job[]> {
    return [...this.jobs];
  }

  async getTotalJobCount(): Promise<number> {
    return this.jobs.length;
  }

  async getJobCountByStatus(status: JobStatus): Promise<number> {
    return this.jobs.filter(job => job.status === status).length;
  }

  async getAllQuotes(): Promise<Quote[]> {
    return [...this.quotes];
  }

  async getOpenJobs(): Promise<Job[]> {
    return this.jobs.filter(job => job.status === "open");
  }

  async getRecentOpenJobs(limit: number): Promise<Job[]> {
    return this.jobs
      .filter(job => job.status === "open")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getJobsForSuggestions(limit: number): Promise<SuggestionJob[]> {
    return this.jobs
      .filter(job => job.status === "open")
      .slice(0, limit)
      .map(job => ({
        title: job.title,
        serviceType: job.serviceType,
        location: { postcode: job.location.postcode }
      }));
  }

  async updateJob(id: string, data: UpdateJobData): Promise<Job> {
    const index = this.jobs.findIndex(j => j.id === id);
    if (index === -1) throw new Error("Job not found");
    const existing = this.jobs[index];
    const updated: Job = {
      ...existing,
      ...data,
      location: data.location ? { ...existing.location, ...data.location } : existing.location,
      updatedAt: new Date()
    } as Job;
    this.jobs[index] = updated;
    return updated;
  }

  async updateJobStatus(id: string, status: JobStatus): Promise<void> {
    const job = this.jobs.find(j => j.id === id);
    if (job) {
      job.status = status;
      job.updatedAt = new Date();
    }
  }

  async deleteJob(id: string): Promise<void> {
    this.jobs = this.jobs.filter(job => job.id !== id);
  }

  // async adminDeleteJob(jobId: string): Promise<void> {
  //   this.quotes = this.quotes.filter(q => q.jobId !== jobId);
  //   this.jobs = this.jobs.filter(job => job.id !== jobId);
  // }
  async adminDeleteJob(jobId: string): Promise<void> {
    this.quotes = this.quotes.filter(q => q.jobId !== jobId);
    this.jobs = this.jobs.filter(job => job.id !== jobId);

    // Ensure the mock chat data is also cleaned up for consistent testing.
    this.chats = this.chats.filter(c => c.jobId !== jobId);
  }

  async searchJobs(params: SearchParams): Promise<SearchResult> {
    const { page = 1, limit = 20, location, radius, noQuotes, datePosted, sortBy, query } = params;

    let filteredJobs = this.jobs.filter(job => {
      if (noQuotes && job.quoteCount !== 0) {
        return false;
      }

      if (params.skills && params.skills.length > 0) {
        const jobSkills = (job.skills || []).map(skill => skill.toLowerCase());
        const requiredSkills = params.skills.map(skill => skill.toLowerCase());
        const hasSkills = requiredSkills.every(skill => jobSkills.includes(skill));
        if (!hasSkills) {
          return false;
        }
      }

      if (datePosted) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - datePosted);
        if (new Date(job.createdAt) < cutoff) {
          return false;
        }
      }

      if (query) {
        const lowercaseQuery = query.toLowerCase();
        const titleMatch = job.title.toLowerCase().includes(lowercaseQuery);
        const postcodeMatch = job.location.postcode?.toLowerCase().includes(lowercaseQuery);
        return titleMatch || postcodeMatch;
      }

      return true;
    });

    if (location && radius) {
      const [lat, lon] = location.split(",").map(Number);
      filteredJobs = filteredJobs.filter(job => {
        const jobLat = job.location.latitude;
        const jobLon = job.location.longitude;
        if (jobLat === undefined || jobLon === undefined) return false;

        const distance = Math.sqrt(Math.pow(jobLat - lat, 2) + Math.pow(jobLon - lon, 2)) * 69;
        return distance <= radius;
      });
    }

    if (sortBy === "budget_high") {
      filteredJobs.sort((a, b) => (b.budget || 0) - (a.budget || 0));
    }

    const totalJobs = filteredJobs.length;
    const totalPages = Math.ceil(totalJobs / limit);
    const paginatedJobs = filteredJobs.slice((page - 1) * limit, page * limit);

    return {
      jobs: paginatedJobs,
      pagination: {
        page,
        limit,
        totalJobs,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        query,
        location,
        radius,
        skills: params.skills,
        noQuotes,
        datePosted,
        sortBy,
        hasActiveFilters: Boolean(
          query || location || radius || (params.skills && params.skills.length > 0) || noQuotes || datePosted || sortBy
        )
      },
      stats: {
        totalAvailable: this.jobs.length,
        filtered: totalJobs,
        emergencyJobs: 0,
        avgBudget: 0
      }
    };
  }

  async createQuote(tradespersonId: string, data: CreateQuoteData): Promise<Quote> {
    const id = (this.quotes.length + 1).toString();
    const quote: Quote = {
      id,
      jobId: data.jobId,
      tradespersonId,
      tradespersonName: "Mock Tradesperson",
      tradespersonPhone: "07123456789",
      price: data.price,
      depositAmount: data.depositAmount,
      description: data.description,
      estimatedDuration: data.estimatedDuration,
      availableDate: data.availableDate,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.quotes.push(quote);
    const job = this.jobs.find(j => j.id === data.jobId);
    if (job) {
      job.quoteCount = (job.quoteCount || 0) + 1;
    }
    return quote;
  }

  async getQuotesByJobId(jobId: string): Promise<Quote[]> {
    return this.quotes.filter(q => q.jobId === jobId);
  }

  async getQuotesByTradespersonId(tradespersonId: string): Promise<Quote[]> {
    return this.quotes.filter(q => q.tradespersonId === tradespersonId);
  }

  async acceptQuote(jobId: string, quoteId: string, customerId: string): Promise<void> {
    const job = this.jobs.find(j => j.id === jobId && j.customerId === customerId);
    if (!job) throw new Error("Job not found or unauthorized");
    const quote = this.quotes.find(q => q.id === quoteId && q.jobId === jobId);
    if (!quote) throw new Error("Quote not found");
    quote.acceptedDate = new Date();
    quote.status = "accepted";
    quote.updatedAt = new Date();
    job.status = "assigned";
    job.tradespersonId = quote.tradespersonId;
    job.updatedAt = new Date();
  }

  async markJobComplete(jobId: string, tradespersonId: string): Promise<void> {
    const job = this.jobs.find(j => j.id === jobId && j.tradespersonId === tradespersonId);
    if (!job) throw new Error("Job not found or unauthorized");
    job.status = "completed";
    job.completedDate = new Date();
    job.updatedAt = new Date();
  }
}

class JobServiceFactory {
  private static instance: JobService | null = null;

  static getInstance(): JobService {
    if (this.instance) return this.instance;

    if (config.isMockMode) {
      if (process.env.NODE_ENV !== "production") {
        console.log("🔧 JobServiceFactory: Using MockJobService");
      }
      this.instance = new MockJobService();
    } else {
      if (process.env.NODE_ENV !== "production") {
        console.log("🔧 JobServiceFactory: Using FirebaseJobService");
      }
      this.instance = new FirebaseJobService();
    }

    return this.instance;
  }
}

export const jobService = JobServiceFactory.getInstance();
