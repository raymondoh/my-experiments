//src/app/dashboard/admin/reports/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Download data in CSV format.</p>
      </div>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard/admin/reports/users">Export Users CSV</Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard/admin/reports/jobs">Export Jobs CSV</Link>
        </Button>
      </div>
    </div>
  );
}
