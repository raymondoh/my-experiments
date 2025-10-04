// src/lib/services/analytics-service.ts
import { format } from "date-fns";
import { userService } from "@/lib/services/user-service";
import { jobService } from "@/lib/services/job-service";
import type { User } from "@/lib/types/user";
import type { Job } from "@/lib/types/job";

interface AnalyticsParams {
  start?: Date;
  end?: Date;
  region?: string;
}

export interface MonthlyMetric {
  label: string;
  users: number;
  jobs: number;
  [key: string]: number | string;
}

class AnalyticsService {
  async getMonthlyMetrics({ start, end, region }: AnalyticsParams): Promise<MonthlyMetric[]> {
    const startDate = start ?? new Date(0);
    const endDate = end ?? new Date();
    const regionLower = region?.toLowerCase() ?? "";

    const [users, jobs] = await Promise.all([userService.getAllUsers(), jobService.getAllJobs()]);

    const inRange = (date: Date | string | number) => {
      const d = new Date(date);
      return d >= startDate && d <= endDate;
    };

    const inRegionUser = (u: User) =>
      regionLower ? (u.location?.postcode?.toLowerCase().startsWith(regionLower) ?? false) : true;
    const inRegionJob = (j: Job) => (regionLower ? j.location.postcode.toLowerCase().startsWith(regionLower) : true);

    const usersByMonth: Record<string, number> = {};
    users
      .filter(u => !!u.createdAt && inRange(u.createdAt) && inRegionUser(u))
      .forEach(u => {
        const key = format(new Date(u.createdAt || new Date()), "yyyy-MM");
        usersByMonth[key] = (usersByMonth[key] || 0) + 1;
      });

    const jobsByMonth: Record<string, number> = {};
    jobs
      .filter(j => inRange(j.createdAt) && inRegionJob(j))
      .forEach(j => {
        const key = format(new Date(j.createdAt), "yyyy-MM");
        jobsByMonth[key] = (jobsByMonth[key] || 0) + 1;
      });

    const months = Array.from(new Set([...Object.keys(usersByMonth), ...Object.keys(jobsByMonth)])).sort();

    return months.map(m => ({
      label: m,
      users: usersByMonth[m] || 0,
      jobs: jobsByMonth[m] || 0
    }));
  }
}

export const analyticsService = new AnalyticsService();
