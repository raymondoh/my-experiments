import { ReactNode } from "react";
import { requireAnyRole } from "@/lib/auth/guards";

export default async function TradespersonDashboardLayout({ children }: { children: ReactNode }) {
  // This guard protects the entire /dashboard/tradesperson route segment
  // for both tradespeople and admins. Customers and other roles will be redirected.
  await requireAnyRole(["tradesperson", "admin"]);

  return <>{children}</>;
}
