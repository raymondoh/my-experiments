// src/app/dashboard/business-owner/layout.tsx
import { ReactNode } from "react";
import { requireAnyRole } from "@/lib/auth/guards";

export default async function BusinessOwnerLayout({ children }: { children: ReactNode }) {
  await requireAnyRole(["business_owner", "admin"]);
  return <>{children}</>;
}
