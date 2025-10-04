import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardHeader, DashboardShell } from "@/components";
import { Separator } from "@/components/ui/separator";
import { createLogger } from "@/lib/logger";
import { listUsers } from "@/lib/services/users";
import { UserService } from "@/lib/services/user-service";

import { UsersClient } from "./UsersClient";

const log = createLogger("dashboard.admin.users");

export const metadata: Metadata = {
  title: "Manage Users - Admin",
  description: "View and manage all users in your application.",
};

export default async function AdminUsersPage() {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    const userRole = await UserService.getUserRole(session.user.id);
    if (userRole !== "admin") {
      redirect("/not-authorized");
    }

    const initial = await listUsers({ limit: 24 });
    log.debug("loaded initial users", {
      count: initial.items.length,
      hasNext: Boolean(initial.nextCursor),
    });

    return (
      <DashboardShell>
        <DashboardHeader
          title="User Management"
          description="View and manage users in your application."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Admin", href: "/admin" }, { label: "Users" }]}
        />
        <Separator className="mb-8" />
        <UsersClient initial={initial} />
      </DashboardShell>
    );
  } catch (error) {
    log.error("failed to render users page", error);
    redirect("/login");
  }
}
