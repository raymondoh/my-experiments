/// src/app/dashboard/analytics/page.tsx
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { hasAnyRole, ROLES } from "@/lib/auth/roles";
import { analyticsService } from "@/lib/services/analytics-service";
import { MultiLineChart } from "@/components/analytics/charts";
import { MetricsTable } from "@/components/analytics/metrics-table";

export default async function AnalyticsDashboardPage() {
  const session = await requireSession();
  if (!hasAnyRole(session.user.role, [ROLES.ADMIN, ROLES.BUSINESS_OWNER])) {
    redirect("/dashboard");
  }

  const monthly = await analyticsService.getMonthlyMetrics({});
  const totals = monthly.reduce(
    (acc, m) => {
      acc.users += m.users;
      acc.jobs += m.jobs;
      return acc;
    },
    { users: 0, jobs: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Overview of platform metrics.</p>
      </div>
      <MetricsTable metrics={[{ label: "Total Users", value: totals.users }, { label: "Total Jobs", value: totals.jobs }]} />
      <div className="h-64">
        <MultiLineChart data={monthly} keys={["users", "jobs"]} colors={["#3b82f6", "#10b981"]} />
      </div>
    </div>
  );
}

