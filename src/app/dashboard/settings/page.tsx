import type { Metadata } from "next";

import { DeleteAccountCard } from "@/components/account/delete-account-card";

export const metadata: Metadata = {
  title: "Settings"
};

export default function DashboardSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Manage your account preferences, security, and data controls from one place.
        </p>
      </div>
      <DeleteAccountCard />
    </div>
  );
}
