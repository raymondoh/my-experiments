// Note: QuoteStatus has been removed and should be imported from 'quote.ts' if needed.
export type JobUrgency = "emergency" | "urgent" | "soon" | "flexible";
export type JobStatus = "open" | "assigned" | "in_progress" | "completed" | "cancelled" | "quoted";

export type PaymentStatus =
  | "pending_deposit"
  | "deposit_paid"
  | "pending_final"
  | "fully_paid"
  | "refunded"
  | "canceled"
  | "authorized"
  | "captured"
  | "succeeded";

export interface JobLocation {
  postcode: string;
  address?: string;
  town?: string;
  latitude?: number;
  longitude?: number;
}

export interface CustomerContact {
  name: string;
  email: string;
  phone: string;
}

export interface Job {
  id: string;
  customerId: string;
  title: string;
  description: string;
  urgency: JobUrgency;
  location: JobLocation;
  customerContact: CustomerContact;
  status: JobStatus;
  tradespersonId?: string;
  budget?: number;
  serviceType?: string;
  skills?: string[];
  isFromOnboarding?: boolean;
  createdAt: Date;
  updatedAt: Date;
  scheduledDate?: Date;
  completedDate?: Date;
  quoteCount?: number;
  distance?: number;
  photos?: string[];
  depositPaymentIntentId?: string;
  finalPaymentIntentId?: string;
  acceptedQuoteId?: string;
  reviewId?: string | null;
  paymentStatus?: PaymentStatus | null;
}

export interface CreateJobData {
  customerId: string;
  title: string;
  description: string;
  urgency?: JobUrgency;
  location: JobLocation | string;
  customerContact: CustomerContact;
  budget?: number;
  serviceType?: string;
  isFromOnboarding?: boolean;
  scheduledDate?: Date;
  photos?: string[];
}

export interface UpdateJobData {
  title?: string;
  description?: string;
  urgency?: JobUrgency;
  location?: JobLocation;
  status?: JobStatus;
  budget?: number;
  serviceType?: string;
  scheduledDate?: Date;
  photos?: string[];
}

// Search-related interfaces
export interface SearchParams {
  query?: string;
  location?: string;
  radius?: number;
  urgency?: JobUrgency;
  minBudget?: number;
  maxBudget?: number;
  noQuotes?: boolean;
  datePosted?: number;
  skills?: string[];
  sortBy?: "newest" | "relevance" | "urgency" | "budget_high" | "budget_low" | "distance";
  page?: number;
  limit?: number;
}

export interface SearchResult {
  jobs: Job[];
  pagination: {
    page: number;
    limit: number;
    totalJobs: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    query?: string;
    location?: string;
    radius?: number;
    urgency?: JobUrgency[];
    minBudget?: number;
    maxBudget?: number;
    skills?: string[];
    noQuotes?: boolean;
    datePosted?: number;
    sortBy?: SearchParams["sortBy"];
    hasActiveFilters: boolean;
  };
  stats: {
    totalAvailable: number;
    filtered: number;
    emergencyJobs: number;
    avgBudget: number;
  };
}

export interface SearchSuggestion {
  type: "job" | "location" | "skill";
  value: string;
  label: string;
  count: number;
}

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface FilterOptions {
  urgency: FilterOption[];
  budgetRanges: {
    label: string;
    min: number;
    max?: number;
    count: number;
  }[];
  datePosted: FilterOption[];
  popularSkills: FilterOption[];
  locations: FilterOption[];
  noQuotesCount: number;
}

// Helper functions for UI
export function getUrgencyColor(urgency: JobUrgency): string {
  switch (urgency) {
    case "emergency":
      return "bg-red-500 text-white hover:bg-red-600";
    case "urgent":
      return "bg-orange-500 text-white hover:bg-orange-600";
    case "soon":
      return "bg-yellow-500 text-white hover:bg-yellow-600";
    case "flexible":
      return "bg-green-500 text-white hover:bg-green-600";
    default:
      return "bg-gray-500 text-white hover:bg-gray-600";
  }
}

export function getUrgencyLabel(urgency: JobUrgency): string {
  switch (urgency) {
    case "emergency":
      return "Emergency";
    case "urgent":
      return "Urgent";
    case "soon":
      return "Soon";
    case "flexible":
      return "Flexible";
    default:
      return "Unknown";
  }
}

// Helper functions for UI
export function getStatusColor(status: JobStatus): string {
  switch (status) {
    case "open":
      return "bg-blue-500 text-white hover:bg-blue-600";
    case "quoted":
      return "bg-cyan-500 text-white hover:bg-cyan-600";
    case "assigned":
      return "bg-purple-500 text-white hover:bg-purple-600";
    case "in_progress":
      return "bg-amber-500 text-white hover:bg-amber-600";
    case "completed":
      return "bg-green-500 text-white hover:bg-green-600";
    case "cancelled":
      return "bg-gray-500 text-white hover:bg-gray-600";
    default:
      return "bg-gray-500 text-white hover:bg-gray-600";
  }
}

export function getStatusLabel(status: JobStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "quoted":
      return "Quoted";
    case "assigned":
      return "Assigned";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Unknown";
  }
}
