// src/app/(legal)/layout.tsx
import React from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getOptionalFreshSession } from "@/lib/auth/require-session";
import { MarketingHeader } from "@/components/layout/marketing-header";

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const session = await getOptionalFreshSession();

  return (
    <>
      <Navbar session={session} />
      <main className="flex flex-col flex-1">
        {/* The container now wraps both the header component and the page content */}
        <div className="container mx-auto py-8 lg:py-12">
          {/* <LegalHeader /> */}
          <MarketingHeader />
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
