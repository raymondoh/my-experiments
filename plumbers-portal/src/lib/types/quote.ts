// src/lib/types/quote.ts
export type QuoteStatus = "pending" | "accepted" | "rejected" | "expired";
export type PaymentStatus = "authorized" | "captured" | "succeeded" | "refunded" | "canceled";

export interface Quote {
  id: string;
  jobId: string;
  tradespersonId: string;
  tradespersonName: string;
  tradespersonPhone: string;
  price: number;
  description: string;
  estimatedDuration: string;
  availableDate: Date;
  status: QuoteStatus;
  depositAmount?: number;
  createdAt: Date;
  updatedAt: Date;
  acceptedDate?: Date;
  rejectedDate?: Date;
}

export type CreateQuoteData = {
  jobId: string;
  price: number;
  depositAmount?: number;
  description: string;
  estimatedDuration: string;
  availableDate: Date;
};
