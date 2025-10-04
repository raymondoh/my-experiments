jest.mock("@/lib/firebase/admin", () => ({
  JobsCollection: jest.fn(),
  getAdminCollection: jest.fn(),
  UsersCollection: jest.fn(),
  NotificationsCollection: jest.fn(),
  COLLECTIONS: {},
}));

import { jobService } from "../job-service";
import type { Job } from "@/lib/types/job";

describe("JobService getJobsForSuggestions", () => {
  beforeEach(() => {
    const now = new Date();
    (jobService as any).jobs = [
      {
        id: "1",
        customerId: "c",
        title: "Fix leak",
        description: "desc",
        urgency: "soon",
        location: { postcode: "P1" },
        customerContact: { name: "n", email: "e", phone: "p" },
        status: "open",
        createdAt: now,
        updatedAt: now,
        serviceType: "Repair",
      } as Job,
      {
        id: "2",
        customerId: "c",
        title: "Closed job",
        description: "desc",
        urgency: "soon",
        location: { postcode: "P2" },
        customerContact: { name: "n", email: "e", phone: "p" },
        status: "completed",
        createdAt: now,
        updatedAt: now,
        serviceType: "Install",
      } as Job,
      {
        id: "3",
        customerId: "c",
        title: "Install sink",
        description: "desc",
        urgency: "soon",
        location: { postcode: "P3" },
        customerContact: { name: "n", email: "e", phone: "p" },
        status: "open",
        createdAt: now,
        updatedAt: now,
        serviceType: "Install",
      } as Job,
    ];
  });

  it("returns open jobs with suggestion fields and respects limit", async () => {
    const limited = await jobService.getJobsForSuggestions(1);
    expect(limited).toEqual([
      { title: "Fix leak", serviceType: "Repair", location: { postcode: "P1" } },
    ]);

    const all = await jobService.getJobsForSuggestions(5);
    expect(all).toEqual([
      { title: "Fix leak", serviceType: "Repair", location: { postcode: "P1" } },
      { title: "Install sink", serviceType: "Install", location: { postcode: "P3" } },
    ]);
  });
});

