// src/app/dashboard/layout.tsx
import React from "react";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { requireSession } from "@/lib/auth/require-session";

// Define the component as a const
const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await requireSession();

  const isEmailVerified = Boolean(session.user.emailVerified);

  return (
    <SidebarProvider>
      <DashboardSidebar session={session} />
      <SidebarInset>
        <DashboardHeader />

        {!isEmailVerified && session.user.email && (
          <div className="p-4 border-b border-border bg-accent/50">
            <EmailVerificationBanner email={session.user.email} />
          </div>
        )}

        <main className="flex flex-1 flex-col gap-4 p-4 pt-6 bg-background overflow-hidden">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

// Export the const as the default
export default DashboardLayout;
