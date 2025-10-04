import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell, DashboardHeader } from "@/components";
import { Separator } from "@/components/ui/separator";
import { UserOrdersClient } from "@/components/dashboard/user/orders/UserOrdersClient";
import { createLogger } from "@/lib/logger";

const log = createLogger("dashboard.user.orders");

export const metadata: Metadata = {
  title: "Your Orders | MotoStix",
  description: "View all your past orders"
};

export default async function UserOrdersPage() {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    return (
      <DashboardShell>
        <DashboardHeader
          title="Your Orders"
          description="View and manage your order history."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dashboard", href: "/user" }, { label: "My Orders" }]}
        />
        <Separator className="mb-8" />

        {/* Added a container with overflow handling */}
        <div className="w-full overflow-hidden">
          <UserOrdersClient />
        </div>
      </DashboardShell>
    );
  } catch (error) {
    log.error("failed", error);
    redirect("/login");
  }
}
