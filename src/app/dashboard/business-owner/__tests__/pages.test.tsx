import { render, screen } from "@testing-library/react";
import type { Session } from "next-auth";
jest.mock("@/app/dashboard/business-owner/actions", () => ({
  createTeamMemberAction: jest.fn(),
  updateTeamMemberAction: jest.fn(),
  assignJobToMemberAction: jest.fn(),
  deleteTeamMemberAction: jest.fn(),
  createInventoryItemAction: jest.fn(),
  updateInventoryItemAction: jest.fn(),
  adjustInventoryQuantityAction: jest.fn(),
  deleteInventoryItemAction: jest.fn(),
  createCustomerRecordAction: jest.fn(),
  updateCustomerRecordAction: jest.fn(),
  recordCustomerInteractionAction: jest.fn(),
  deleteCustomerRecordAction: jest.fn()
}));

import BusinessOwnerDashboardPage from "@/app/dashboard/business-owner/page";
import BusinessOwnerTeamPage from "@/app/dashboard/business-owner/team/page";
import BusinessOwnerInventoryPage from "@/app/dashboard/business-owner/inventory/page";
import BusinessOwnerCustomersPage from "@/app/dashboard/business-owner/customers/page";
import { TeamManagementPanel } from "@/app/dashboard/business-owner/_components/team-management-panel";
import { InventoryManagementPanel } from "@/app/dashboard/business-owner/_components/inventory-management-panel";
import { CustomerRecordsPanel } from "@/app/dashboard/business-owner/_components/customer-records-panel";

jest.mock("@/lib/auth/require-session", () => ({
  requireSession: jest.fn<Promise<Session>, []>()
}));
import { requireSession } from "@/lib/auth/require-session";

jest.mock("@/lib/services/team-service", () => ({
  teamService: { listMembers: jest.fn() }
}));
import { teamService } from "@/lib/services/team-service";

jest.mock("@/lib/services/inventory-service", () => ({
  inventoryService: { listItems: jest.fn() }
}));
import { inventoryService } from "@/lib/services/inventory-service";

jest.mock("@/lib/services/customer-service", () => ({
  customerService: { listCustomers: jest.fn() }
}));
import { customerService } from "@/lib/services/customer-service";

jest.mock("@/app/dashboard/business-owner/_components/team-management-panel", () => ({
  TeamManagementPanel: jest.fn(() => <div data-testid="team-panel" />)
}));

jest.mock("@/app/dashboard/business-owner/_components/inventory-management-panel", () => ({
  InventoryManagementPanel: jest.fn(() => <div data-testid="inventory-panel" />)
}));

jest.mock("@/app/dashboard/business-owner/_components/customer-records-panel", () => ({
  CustomerRecordsPanel: jest.fn(() => <div data-testid="customers-panel" />)
}));

const mockedRequire = requireSession as unknown as jest.Mock<Promise<Session>, []>;
const mockedTeamService = teamService.listMembers as jest.Mock;
const mockedInventoryService = inventoryService.listItems as jest.Mock;
const mockedCustomerService = customerService.listCustomers as jest.Mock;
const mockedTeamPanel = TeamManagementPanel as unknown as jest.Mock;
const mockedInventoryPanel = InventoryManagementPanel as unknown as jest.Mock;
const mockedCustomerPanel = CustomerRecordsPanel as unknown as jest.Mock;

function buildSession(): Session {
  return {
    user: {
      id: "user-1",
      name: "Business Owner",
      email: "owner@example.com",
      role: "business_owner",
      emailVerified: new Date()
    },
    expires: ""
  } as Session;
}

describe("business owner dashboard pages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequire.mockResolvedValue(buildSession());
  });

  it("renders overview metrics", async () => {
    mockedTeamService.mockResolvedValue([
      {
        id: "1",
        ownerId: "user-1",
        name: "Alex",
        role: "Engineer",
        active: true,
        assignedJobs: ["job-1"],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "2",
        ownerId: "user-1",
        name: "Bailey",
        role: "Apprentice",
        active: false,
        assignedJobs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    mockedInventoryService.mockResolvedValue([
      {
        id: "inv-1",
        ownerId: "user-1",
        name: "Pipe",
        sku: "P-01",
        quantity: 2,
        reorderLevel: 5,
        unitCost: 3.5,
        location: "Van",
        notes: "",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "inv-2",
        ownerId: "user-1",
        name: "Sealant",
        sku: "S-01",
        quantity: 10,
        reorderLevel: 3,
        unitCost: 2,
        location: "Depot",
        notes: "",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    mockedCustomerService.mockResolvedValue([
      {
        id: "cust-1",
        ownerId: "user-1",
        name: "Mr Smith",
        email: "smith@example.com",
        phone: "01234",
        lastServiceDate: new Date(),
        totalJobs: 3,
        totalSpend: 450,
        notes: "",
        interactionHistory: [
          {
            id: "i-1",
            note: "Boiler service",
            createdAt: new Date(),
            createdBy: "Alex",
            followUpDate: new Date(),
            jobId: "job-1",
            amount: 150
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const ui = await BusinessOwnerDashboardPage();
    render(ui);

    expect(screen.getByText("Business Operations Hub")).toBeInTheDocument();
    expect(screen.getByText("Total Team Members")).toBeInTheDocument();
    expect(screen.getByText(/1 active · 1 jobs assigned/i)).toBeInTheDocument();
    expect(screen.getByText("Low Stock Items")).toBeInTheDocument();
    expect(screen.getByText("Total Customers")).toBeInTheDocument();
  });

  it("passes data to team management panel", async () => {
    mockedTeamService.mockResolvedValue([
      {
        id: "1",
        ownerId: "user-1",
        name: "Alex",
        role: "Engineer",
        active: true,
        assignedJobs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const ui = await BusinessOwnerTeamPage();
    render(ui);

    expect(screen.getByText("Team Management")).toBeInTheDocument();
    expect(screen.getByTestId("team-panel")).toBeInTheDocument();
    expect(mockedTeamPanel).toHaveBeenCalled();
    const teamProps = mockedTeamPanel.mock.calls[0][0];
    expect(teamProps.members).toEqual(expect.arrayContaining([expect.objectContaining({ name: "Alex" })]));
  });

  it("passes data to inventory panel", async () => {
    mockedInventoryService.mockResolvedValue([
      {
        id: "inv-1",
        ownerId: "user-1",
        name: "Pipe",
        sku: "P-01",
        quantity: 2,
        reorderLevel: 5,
        unitCost: 3.5,
        location: "Van",
        notes: "",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const ui = await BusinessOwnerInventoryPage();
    render(ui);

    expect(screen.getByText("Inventory")).toBeInTheDocument();
    expect(screen.getByTestId("inventory-panel")).toBeInTheDocument();
    expect(mockedInventoryPanel).toHaveBeenCalled();
    const inventoryProps = mockedInventoryPanel.mock.calls[0][0];
    expect(inventoryProps.items).toEqual(expect.arrayContaining([expect.objectContaining({ sku: "P-01" })]));
  });

  it("passes data to customer records panel", async () => {
    mockedCustomerService.mockResolvedValue([
      {
        id: "cust-1",
        ownerId: "user-1",
        name: "Mr Smith",
        email: "smith@example.com",
        phone: "01234",
        lastServiceDate: new Date(),
        totalJobs: 1,
        totalSpend: 120,
        notes: "",
        interactionHistory: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const ui = await BusinessOwnerCustomersPage();
    render(ui);

    expect(screen.getByText("Customer Records")).toBeInTheDocument();
    expect(screen.getByTestId("customers-panel")).toBeInTheDocument();
    expect(mockedCustomerPanel).toHaveBeenCalled();
    const customerProps = mockedCustomerPanel.mock.calls[0][0];
    expect(customerProps.customers).toEqual(expect.arrayContaining([expect.objectContaining({ name: "Mr Smith" })]));
  });
});
