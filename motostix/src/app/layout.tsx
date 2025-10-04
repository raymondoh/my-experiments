// src/app/layout.tsx
import type React from "react";
import type { Metadata } from "next";

import { siteConfig } from "@/config/siteConfig";
import { ClientLayout } from "./client-layout";
import "./globals.css";

const rawMetadataBase = process.env.NEXT_PUBLIC_APP_URL ?? "/";
const metadataBase =
  rawMetadataBase === "/"
    ? undefined
    : (() => {
        try {
          return new URL(rawMetadataBase);
        } catch (error) {
          console.warn("Invalid NEXT_PUBLIC_APP_URL, skipping metadataBase", error);
          return undefined;
        }
      })();

const ogImage = process.env.OG_IMAGE_URL ?? siteConfig.ogImage;

export const metadata: Metadata = {
  // ✅ Site-wide defaults belong here. Use export const metadata or generateMetadata inside a page/route to override per-view values.
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  metadataBase,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: ogImage
      ? [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: siteConfig.name
          }
        ]
      : undefined,
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitter || undefined,
    title: siteConfig.name,
    description: siteConfig.description,
    images: ogImage ? [ogImage] : undefined
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="relative">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
