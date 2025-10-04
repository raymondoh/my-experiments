import FilterForm from "./filter-form";
import { getFilteredAnalytics } from "./actions";
import { MultiLineChart } from "@/components/analytics/charts";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  const params = await searchParams;
  const start = typeof params.start === "string" ? params.start : undefined;
  const end = typeof params.end === "string" ? params.end : undefined;
  const region = typeof params.region === "string" ? params.region : undefined;

  const data = await getFilteredAnalytics({ start, end, region });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Filter by date range and region.</p>
      </div>
      <FilterForm start={start} end={end} region={region} />
      <div className="h-64">
        <MultiLineChart data={data.monthly} keys={["users", "jobs"]} colors={["#3b82f6", "#10b981"]} />
      </div>
    </div>
  );
}
