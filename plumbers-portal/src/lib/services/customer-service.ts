// src/lib/services/customer-service.ts
import { config } from "@/lib/config/app-mode";
import { BusinessCustomersCollection } from "@/lib/firebase/admin";
import type {
  CustomerRecord,
  CreateCustomerRecordInput,
  UpdateCustomerRecordInput,
  CustomerInteraction,
  RecordCustomerInteractionInput
} from "@/lib/types/business-owner";
import { randomUUID } from "crypto";

interface CustomerService {
  listCustomers(ownerId: string): Promise<CustomerRecord[]>;
  createCustomer(ownerId: string, input: CreateCustomerRecordInput): Promise<CustomerRecord>;
  updateCustomer(ownerId: string, customerId: string, updates: UpdateCustomerRecordInput): Promise<CustomerRecord>;
  recordInteraction(
    ownerId: string,
    customerId: string,
    input: RecordCustomerInteractionInput & { createdBy: string }
  ): Promise<CustomerRecord>;
  deleteCustomer(ownerId: string, customerId: string): Promise<void>;
}

type CustomerRecordDocument = Omit<CustomerRecord, "id" | "createdAt" | "updatedAt" | "interactionHistory"> & {
  createdAt: FirebaseFirestore.Timestamp | Date;
  updatedAt: FirebaseFirestore.Timestamp | Date;
  interactionHistory: Array<Omit<CustomerInteraction, "createdAt"> & { createdAt: FirebaseFirestore.Timestamp | Date }>;
};

function toCustomerRecord(id: string, data: CustomerRecordDocument): CustomerRecord {
  const createdAt = data.createdAt instanceof Date ? data.createdAt : data.createdAt.toDate();
  const updatedAt = data.updatedAt instanceof Date ? data.updatedAt : data.updatedAt.toDate();
  return {
    id,
    ownerId: data.ownerId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    lastServiceDate:
      data.lastServiceDate instanceof Date ? data.lastServiceDate : ((data.lastServiceDate as any)?.toDate() ?? null),
    totalJobs: data.totalJobs ?? 0,
    totalSpend: data.totalSpend ?? 0,
    notes: data.notes,
    interactionHistory: (data.interactionHistory || []).map(entry => ({
      ...entry,
      createdAt: entry.createdAt instanceof Date ? entry.createdAt : entry.createdAt.toDate()
    })),
    createdAt,
    updatedAt
  };
}

class FirebaseCustomerService implements CustomerService {
  async listCustomers(ownerId: string): Promise<CustomerRecord[]> {
    const snapshot = await BusinessCustomersCollection().where("ownerId", "==", ownerId).orderBy("name").get();

    return snapshot.docs.map(doc => toCustomerRecord(doc.id, doc.data() as CustomerRecordDocument));
  }

  async createCustomer(ownerId: string, input: CreateCustomerRecordInput): Promise<CustomerRecord> {
    const now = new Date();
    const doc = await BusinessCustomersCollection().add({
      ownerId,
      ...input,
      lastServiceDate: input.lastServiceDate ?? null,
      totalJobs: 0,
      totalSpend: 0,
      interactionHistory: [],
      createdAt: now,
      updatedAt: now
    });

    const snapshot = await doc.get();
    return toCustomerRecord(snapshot.id, snapshot.data() as CustomerRecordDocument);
  }

  async updateCustomer(
    ownerId: string,
    customerId: string,
    updates: UpdateCustomerRecordInput
  ): Promise<CustomerRecord> {
    const ref = BusinessCustomersCollection().doc(customerId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new Error("Customer record not found");
    }
    const data = snapshot.data() as CustomerRecordDocument;
    if (data.ownerId !== ownerId) {
      throw new Error("You do not have permission to update this customer");
    }

    const sanitizedUpdates = { ...updates } as UpdateCustomerRecordInput & { updatedAt: Date };
    sanitizedUpdates.updatedAt = new Date();

    await ref.update({ ...sanitizedUpdates });
    const updatedSnapshot = await ref.get();
    return toCustomerRecord(updatedSnapshot.id, updatedSnapshot.data() as CustomerRecordDocument);
  }

  async recordInteraction(
    ownerId: string,
    customerId: string,
    input: RecordCustomerInteractionInput & { createdBy: string }
  ): Promise<CustomerRecord> {
    const ref = BusinessCustomersCollection().doc(customerId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new Error("Customer record not found");
    }
    const data = snapshot.data() as CustomerRecordDocument;
    if (data.ownerId !== ownerId) {
      throw new Error("You do not have permission to update this customer");
    }

    const history = data.interactionHistory || [];
    const entry = {
      id: randomUUID(),
      note: input.note,
      jobId: input.jobId,
      amount: input.amount,
      followUpDate: input.followUpDate ?? null,
      createdBy: input.createdBy,
      createdAt: new Date()
    } satisfies CustomerInteraction;

    const nextHistory = [...history, entry];
    const nextTotalJobs = input.jobId ? (data.totalJobs ?? 0) + 1 : (data.totalJobs ?? 0);
    const nextTotalSpend = input.amount ? (data.totalSpend ?? 0) + input.amount : (data.totalSpend ?? 0);
    const nextLastServiceDate = input.followUpDate ?? data.lastServiceDate ?? null;

    await ref.update({
      interactionHistory: nextHistory,
      totalJobs: nextTotalJobs,
      totalSpend: nextTotalSpend,
      lastServiceDate: nextLastServiceDate,
      updatedAt: new Date()
    });

    const updatedSnapshot = await ref.get();
    return toCustomerRecord(updatedSnapshot.id, updatedSnapshot.data() as CustomerRecordDocument);
  }

  async deleteCustomer(ownerId: string, customerId: string): Promise<void> {
    const ref = BusinessCustomersCollection().doc(customerId);
    const snapshot = await ref.get();
    if (!snapshot.exists) return;
    const data = snapshot.data() as CustomerRecordDocument;
    if (data.ownerId !== ownerId) {
      throw new Error("You do not have permission to delete this customer");
    }
    await ref.delete();
  }
}

class MockCustomerService implements CustomerService {
  private customersByOwner = new Map<string, CustomerRecord[]>();

  private clone(record: CustomerRecord): CustomerRecord {
    return {
      ...record,
      interactionHistory: record.interactionHistory.map(entry => ({ ...entry, createdAt: new Date(entry.createdAt) })),
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt)
    };
  }

  private getCollection(ownerId: string): CustomerRecord[] {
    if (!this.customersByOwner.has(ownerId)) {
      this.customersByOwner.set(ownerId, []);
    }
    return this.customersByOwner.get(ownerId)!;
  }

  async listCustomers(ownerId: string): Promise<CustomerRecord[]> {
    return this.getCollection(ownerId).map(record => this.clone(record));
  }

  async createCustomer(ownerId: string, input: CreateCustomerRecordInput): Promise<CustomerRecord> {
    const now = new Date();
    const record: CustomerRecord = {
      id: randomUUID(),
      ownerId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      lastServiceDate: input.lastServiceDate ?? null,
      totalJobs: 0,
      totalSpend: 0,
      notes: input.notes,
      interactionHistory: [],
      createdAt: now,
      updatedAt: now
    };
    this.getCollection(ownerId).push(record);
    return this.clone(record);
  }

  async updateCustomer(
    ownerId: string,
    customerId: string,
    updates: UpdateCustomerRecordInput
  ): Promise<CustomerRecord> {
    const records = this.getCollection(ownerId);
    const index = records.findIndex(record => record.id === customerId);
    if (index === -1) throw new Error("Customer record not found");
    const existing = records[index];
    const updated: CustomerRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    if (updates.lastServiceDate === undefined) {
      updated.lastServiceDate = existing.lastServiceDate;
    }
    records[index] = updated;
    return this.clone(updated);
  }

  async recordInteraction(
    ownerId: string,
    customerId: string,
    input: RecordCustomerInteractionInput & { createdBy: string }
  ): Promise<CustomerRecord> {
    const records = this.getCollection(ownerId);
    const index = records.findIndex(record => record.id === customerId);
    if (index === -1) throw new Error("Customer record not found");
    const existing = records[index];
    const entry: CustomerInteraction = {
      id: randomUUID(),
      note: input.note,
      jobId: input.jobId,
      amount: input.amount,
      followUpDate: input.followUpDate ?? null,
      createdBy: input.createdBy,
      createdAt: new Date()
    };
    existing.interactionHistory = [...existing.interactionHistory, entry];
    if (input.jobId) {
      existing.totalJobs += 1;
    }
    if (input.amount) {
      existing.totalSpend += input.amount;
    }
    if (input.followUpDate) {
      existing.lastServiceDate = input.followUpDate;
    }
    existing.updatedAt = new Date();
    records[index] = existing;
    return this.clone(existing);
  }

  async deleteCustomer(ownerId: string, customerId: string): Promise<void> {
    const records = this.getCollection(ownerId);
    const index = records.findIndex(record => record.id === customerId);
    if (index !== -1) {
      records.splice(index, 1);
    }
  }
}

class CustomerServiceFactory {
  private static instance: CustomerService | null = null;

  static getInstance(): CustomerService {
    if (this.instance) return this.instance;

    if (config.isMockMode) {
      if (process.env.NODE_ENV !== "production") {
        console.log("🔧 CustomerServiceFactory: Using MockCustomerService");
      }
      this.instance = new MockCustomerService();
    } else {
      if (process.env.NODE_ENV !== "production") {
        console.log("🔧 CustomerServiceFactory: Using FirebaseCustomerService");
      }
      this.instance = new FirebaseCustomerService();
    }

    return this.instance;
  }
}

export const customerService = CustomerServiceFactory.getInstance();
export type { CustomerService };
