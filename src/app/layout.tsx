// src/app/layout.tsx
import type React from "react";
import type { Metadata } from "next";

import { Inter } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import SessionProvider from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import ModalProvider from "@/components/providers/modal-provider";
import FavoritesProvider from "@/components/providers/favorites-provider";
import { getOptionalFreshSession } from "@/lib/auth/require-session";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { validateEnv } from "@/lib/env";
import { userService } from "@/lib/services/user-service";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.creator,
  metadataBase: siteConfig.metadataBase,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@plumbersportal"
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png"
  },
  manifest: "/site.webmanifest"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  validateEnv();
  // ✅ Use enriched session so Navbar sees fresh role/tier
  const session = await getOptionalFreshSession();

  let initialFavoriteIds: string[] = [];
  if (session?.user?.id && session.user.role === "customer") {
    try {
      const favorites = await userService.getFavoriteTradespeople(session.user.id);
      initialFavoriteIds = favorites
        .map(favorite => favorite.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);
    } catch (error) {
      console.error("RootLayout: Failed to load initial favorites", error);
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <SessionProvider session={session}>
              <FavoritesProvider initialFavorites={initialFavoriteIds}>
                {/* --- THIS IS THE FIX --- */}
                {/* Added `overflow-x-hidden` to prevent horizontal scrolling on mobile */}
                <div className="flex flex-col min-h-screen overflow-x-hidden">
                  <main className="flex-1">{children}</main>
                </div>
                <Toaster />
                <ModalProvider />
              </FavoritesProvider>
            </SessionProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
