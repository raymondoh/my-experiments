import type { ReactNode } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { siteConfig } from "@/config/siteConfig";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardThemeProvider } from "@/providers/DashboardThemeProvider";
import { requireAuth } from "@/lib/guards/auth";

export const metadata: Metadata = {
  // Dashboard-specific title template
  title: {
    template: `%s | Dashboard | ${siteConfig.name}`,
    default: `Dashboard | ${siteConfig.name}`
  },

  // Dashboard description
  description:
    "Manage your MotoStix account, view orders, track shipments, and access your custom sticker designs from your personal dashboard.",

  // Dashboard-specific keywords
  keywords: [
    "motostix dashboard",
    "account management",
    "order tracking",
    "user dashboard",
    "account settings",
    "order history",
    "custom designs",
    "user portal",
    "account overview"
  ],

  // Dashboard pages should NOT be indexed - private user data
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
      noimageindex: true
    }
  },

  // No Open Graph for dashboard - these are private pages
  // Individual dashboard pages shouldn't be shared on social media

  // Enhanced security headers for dashboard
  other: {
    "X-Frame-Options": "DENY", // Prevent embedding in frames
    "X-Content-Type-Options": "nosniff",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cache-Control": "no-cache, no-store, must-revalidate", // Don't cache private pages
    Pragma: "no-cache",
    Expires: "0",
    // Content Security Policy for dashboard security
    "Content-Security-Policy": "frame-ancestors 'none';" // Additional clickjacking protection
  }
};

// This layout uses auth() or headers(), so force dynamic rendering
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAuth();

  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar:state");
  const sidebarState = sidebarCookie ? sidebarCookie.value === "true" : false;
  const role = session.user.role === "admin" ? "admin" : "user";

  return (
    <DashboardThemeProvider>
      <SidebarProvider defaultOpen={sidebarState}>
        {/* The w-full class here is crucial for proper layout */}
        <div className="flex h-screen overflow-hidden w-full">
          {/* Sidebar component */}
          <AppSidebar />

          {/* Main content area */}
          <SidebarInset className="flex-1 flex flex-col w-full">
            {/* Enhanced header with darker border and shadow */}
            <header className="flex h-16 items-center justify-between px-6 sticky top-0 bg-muted backdrop-blur-sm z-10 shadow-lg">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="rounded-full hover:bg-muted p-2 transition-colors" />
                <h1 className="font-semibold text-lg hidden sm:block">
                  {role === "admin" ? "Admin Dashboard" : "My Account"}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="text-sm font-medium flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back to Store</span>
                </Link>
              </div>
            </header>

            {/* Main content with enhanced styling */}
            <main className="flex-1 overflow-auto bg-muted/30">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Content wrapper with subtle styling */}
                <div className="bg-background rounded-xl shadow-sm border p-6">{children}</div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </DashboardThemeProvider>
  );
}
