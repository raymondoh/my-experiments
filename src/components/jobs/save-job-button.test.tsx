import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SaveJobButton } from "./save-job-button";
import { useSession } from "next-auth/react";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn()
}));

const mockUseSession = useSession as jest.Mock;
const originalFetch = global.fetch;

describe("SaveJobButton", () => {
  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  it("returns null for basic tier", () => {
    mockUseSession.mockReturnValue({ data: { user: { subscriptionTier: "basic" } }, status: "authenticated" });
    const { container } = render(<SaveJobButton jobId="1" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders button for pro tier", async () => {
    mockUseSession.mockReturnValue({ data: { user: { subscriptionTier: "pro" } }, status: "authenticated" });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ savedJobs: [] })
    }) as unknown as typeof fetch;

    render(<SaveJobButton jobId="1" />);
    expect(await screen.findByRole("button", { name: /save job/i })).toBeInTheDocument();
  });

  it("shows 'Saved' when job is already saved and removal is not allowed", async () => {
    mockUseSession.mockReturnValue({ data: { user: { subscriptionTier: "pro" } }, status: "authenticated" });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ savedJobs: ["1"] })
    }) as unknown as typeof fetch;

    render(<SaveJobButton jobId="1" />);
    const savedButton = await screen.findByRole("button", { name: /saved/i });
    expect(savedButton).toBeDisabled();
  });

  it("renders 'Remove Job' when job is saved and allowRemove is true", async () => {
    mockUseSession.mockReturnValue({ data: { user: { subscriptionTier: "pro" } }, status: "authenticated" });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ savedJobs: ["1"] })
    }) as unknown as typeof fetch;

    render(<SaveJobButton jobId="1" allowRemove />);
    expect(await screen.findByRole("button", { name: /remove job/i })).toBeInTheDocument();
  });
});
