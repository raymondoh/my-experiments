// src/app/layout.tsx
import type React from "react";
import type { Metadata } from "next";

import { baseMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/siteConfig";
import { ClientLayout } from "./client-layout";
import "./globals.css";

export const metadata: Metadata = baseMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="relative" data-site-name={siteConfig.name}>
        {/**
         * Example header using the shared navigation config if you ever need to render
         * it here instead of inside <ClientLayout />:
         * <header>
         *   <nav>
         *     <ul className="flex gap-4">
         *       {siteConfig.nav.map((item) => (
         *         <li key={item.href}>
         *           <a
         *             href={item.href}
         *             target={item.external ? "_blank" : undefined}
         *             rel={item.external ? "noreferrer" : undefined}
         *           >
         *             {item.label}
         *           </a>
         *         </li>
         *       ))}
         *     </ul>
         *   </nav>
         * </header>
         */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
