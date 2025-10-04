// src/app/(marketing)/layout.tsx
import React from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getOptionalFreshSession } from "@/lib/auth/require-session";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await getOptionalFreshSession();

  return (
    <>
      <Navbar session={session} />
      {/* The main content area now uses a consistent structure */}
      <main className="flex flex-col flex-1">
        {/* The container is now part of the layout for consistency */}
        <div className="container mx-auto py-8 lg:py-12">{children}</div>
      </main>
      <Footer />
    </>
  );
}
