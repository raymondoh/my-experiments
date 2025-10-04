// src/app/dashboard/business-owner/page.tsx
import Link from "next/link";
import { requireSession } from "@/lib/auth/require-session";
import { teamService } from "@/lib/services/team-service";
import { inventoryService } from "@/lib/services/inventory-service";
import { customerService } from "@/lib/services/customer-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Boxes, LineChart, Contact } from "lucide-react";

const LOW_STOCK_THRESHOLD = 5;
const currencyFormatter = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

function normalizeDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value?: Date | string | null) {
  const date = normalizeDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}

export default async function BusinessOwnerDashboardPage() {
  const session = await requireSession();
  const ownerId = session.user.id;

  const [teamMembers, inventoryItems, customers] = await Promise.all([
    teamService.listMembers(ownerId),
    inventoryService.listItems(ownerId),
    customerService.listCustomers(ownerId)
  ]);

  const totalTeamMembers = teamMembers.length;
  const activeMembers = teamMembers.filter(member => member.active).length;
  const totalAssignedJobs = teamMembers.reduce((total, member) => total + member.assignedJobs.length, 0);

  const lowStockItems = inventoryItems.filter(item => {
    const quantity = item.quantity ?? 0;
    const reorderLevel = item.reorderLevel ?? LOW_STOCK_THRESHOLD;
    const threshold = Math.max(reorderLevel, LOW_STOCK_THRESHOLD);
    return quantity <= threshold;
  });

  const totalInventoryValue = inventoryItems.reduce(
    (total, item) => total + (item.unitCost ?? 0) * (item.quantity ?? 0),
    0
  );

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const upcomingFollowUps = customers
    .flatMap(customer =>
      customer.interactionHistory.map(interaction => ({
        customer,
        interaction,
        followUpDate: normalizeDate(interaction.followUpDate)
      }))
    )
    .filter(entry => entry.followUpDate && entry.followUpDate >= startOfToday)
    .sort(
      (a, b) =>
        (a.followUpDate?.getTime() ?? Number.POSITIVE_INFINITY) -
        (b.followUpDate?.getTime() ?? Number.POSITIVE_INFINITY)
    )
    .slice(0, 3);

  const busiestTechnicians = [...teamMembers]
    .sort((a, b) => b.assignedJobs.length - a.assignedJobs.length)
    .slice(0, 5);

  const recentCustomers = [...customers]
    .sort(
      (a, b) =>
        (normalizeDate(b.updatedAt)?.getTime() ?? 0) -
        (normalizeDate(a.updatedAt)?.getTime() ?? 0)
    )
    .slice(0, 5);

  const totalCustomers = customers.length;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Business Operations Hub</h1>
        <p className="text-muted-foreground">
          Track your team, inventory, and customer relationships from one central place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeamMembers}</div>
            <p className="text-xs text-muted-foreground">
              {activeMembers} active · {totalAssignedJobs} jobs assigned
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Threshold ≤{LOW_STOCK_THRESHOLD} units across {inventoryItems.length} SKUs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Contact className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingFollowUps.length} follow-ups scheduled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Inventory Value</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencyFormatter.format(totalInventoryValue)}</div>
            <p className="text-xs text-muted-foreground">Based on recorded unit costs</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Team Capacity Overview</CardTitle>
              <CardDescription>Monitor workload distribution across your technicians.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/business-owner/team">Manage team</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">You have not added any team members yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Technician Name</TableHead>
                    <TableHead className="text-right">Assigned Jobs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {busiestTechnicians.map(member => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="text-right">{member.assignedJobs.length}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Customer Follow-ups</CardTitle>
            <CardDescription>Stay on top of repeat work and customer check-ins.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingFollowUps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No follow-ups scheduled.</p>
            ) : (
              upcomingFollowUps.map(({ customer, interaction, followUpDate }) => (
                <div key={interaction.id} className="rounded-md border border-border p-3">
                  <p className="text-sm font-semibold">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">Due {formatDate(followUpDate)}</p>
                  {interaction.note ? <p className="mt-2 text-sm">{interaction.note}</p> : null}
                </div>
              ))
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/business-owner/customers">View customer records</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Customer Activity</CardTitle>
            <CardDescription>Review the latest updates across your client base.</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href="/dashboard/business-owner/customers">Manage customers</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {totalCustomers === 0 ? (
            <p className="text-sm text-muted-foreground">No customer records yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Assigned Jobs</TableHead>
                  <TableHead className="text-right">Total Spend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCustomers.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{formatDate(customer.updatedAt)}</TableCell>
                    <TableCell className="text-right">{customer.totalJobs}</TableCell>
                    <TableCell className="text-right">{currencyFormatter.format(customer.totalSpend ?? 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
