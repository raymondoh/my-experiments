import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import JobsPageClient from "./jobs-page-client";
import { useSession } from "next-auth/react";
// FIX: Import the Job and JobUrgency types to create valid mock data
import type { Job, JobUrgency, JobStatus } from "@/lib/types/job";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => new URLSearchParams()
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn()
}));

const mockUseSession = useSession as jest.Mock;

// ... (other mocks remain the same) ...

describe("JobsPageClient", () => {
  // FIX: Define mockJobs with the correct types for urgency and status
  const mockJobs: Job[] = [
    {
      id: "1",
      customerId: "c1",
      title: "Test Job 1",
      description: "desc",
      urgency: "urgent" as JobUrgency,
      location: { postcode: "AB12" },
      customerContact: { name: "Customer One", email: "e", phone: "p" },
      status: "open" as JobStatus,
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01")
    },
    {
      id: "2",
      customerId: "c2",
      title: "Test Job 2",
      description: "desc 2",
      urgency: "normal" as JobUrgency,
      location: { postcode: "CD34" },
      customerContact: { name: "Customer Two", email: "e2", phone: "p2" },
      status: "open" as JobStatus,
      createdAt: new Date("2023-01-02"),
      updatedAt: new Date("2023-01-02")
    }
  ];

  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: { user: { subscriptionTier: "basic" } }, status: "authenticated" });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the jobs passed to it", () => {
    render(<JobsPageClient jobs={mockJobs} />);

    expect(screen.getByText("Test Job 1")).toBeInTheDocument();
    expect(screen.getByText("Customer One")).toBeInTheDocument();
    expect(screen.getByText("Test Job 2")).toBeInTheDocument();
    expect(screen.getByText("Customer Two")).toBeInTheDocument();
  });

  it("filters jobs based on user input", async () => {
    const user = userEvent.setup();
    render(<JobsPageClient jobs={mockJobs} />);

    const input = screen.getByPlaceholderText("Filter by job title or customer...");
    await user.type(input, "Job 2");

    expect(screen.queryByText("Test Job 1")).not.toBeInTheDocument();
    expect(screen.getByText("Test Job 2")).toBeInTheDocument();
  });
});
