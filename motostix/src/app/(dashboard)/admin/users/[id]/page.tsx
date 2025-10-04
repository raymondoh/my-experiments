import { DashboardShell, DashboardHeader } from "@/components";
import { Separator } from "@/components/ui/separator";
import { redirect } from "next/navigation";
import { AdminUserTabs } from "@/components/dashboard/admin/users/AdminUserTabs";
import { serializeUser } from "@/utils/serializeUser";
import { createLogger } from "@/lib/logger";
import { getUserProfile } from "@/lib/services/users";
import type { User } from "@/types/user";

const log = createLogger("dashboard.admin.users.detail");

export default async function AdminUserTabsPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Dynamic import for auth to avoid build-time issues
    const { auth } = await import("@/auth");

    // 1) Ensure user is signed in
    const session = await auth();
    if (!session?.user) {
      redirect("/login");
    }

    // 2) Check current user is an admin
    const currentUserId = session.user.id;
    const adminProfile = await getUserProfile(currentUserId);
    if (adminProfile?.role !== "admin") {
      log.warn("admin role required", { currentUserId });
      redirect("/not-authorized");
    }

    // 3) Fetch the target user
    const profile = await getUserProfile(userId);
    if (!profile) {
      redirect("/admin/users");
    }

    const rawData: User = {
      id: profile.id,
      name: profile.name ?? undefined,
      email: profile.email ?? undefined,
      image: profile.image ?? undefined,
      role: profile.role,
      createdAt: profile.createdAtISO,
      updatedAt: profile.updatedAtISO,
    };
    const serializedUser = serializeUser(rawData);

    // 4) Render the dashboard shell + tabs
    return (
      <DashboardShell>
        <DashboardHeader
          title="User Details"
          description={`View and manage details for ${serializedUser.name || serializedUser.email || "user"}.`}
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Admin", href: "/admin" },
            { label: "Users", href: "/admin/users" },
            { label: "User Details" }
          ]}
        />
        <Separator className="mb-8" />

        <div className="w-full max-w-full overflow-hidden">
          <AdminUserTabs user={serializedUser} />
        </div>
      </DashboardShell>
    );
  } catch (error) {
    log.error("failed", error, { userId });
    redirect("/login");
  }
}
