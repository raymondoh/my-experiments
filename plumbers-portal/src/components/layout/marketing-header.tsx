// src/components/layout/marketing-header.tsx
"use client";

import { usePathname } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

// Helper to format a path segment like "how-it-works" into a title like "How It Works"
function formatSegmentToTitle(segment: string): string {
  if (!segment) return "";
  const title = segment.replace(/-/g, " ");
  // Capitalize the first letter of each word
  return title.replace(/\b\w/g, char => char.toUpperCase());
}

export function MarketingHeader() {
  const pathname = usePathname();

  // Split the pathname into segments and filter out any empty strings from trailing slashes
  const pathSegments = pathname.split("/").filter(Boolean);

  // Don't render breadcrumbs on the homepage
  if (pathSegments.length === 0) {
    return null;
  }

  // Build the breadcrumb segments array dynamically
  const segments = pathSegments.map((segment, index) => {
    // Reconstruct the href for each part of the path
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const title = formatSegmentToTitle(segment);
    return { title, href };
  });

  return (
    <header className="">
      <div className="container mx-auto">
        <Breadcrumbs segments={segments} />
      </div>
    </header>
  );
}
