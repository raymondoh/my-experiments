// components/seo/json-ld.tsx
"use client";

import React from "react";

type Json = Record<string, any>;

export function JsonLd({ data }: { data: Json }) {
  // Ensures valid JSON string and avoids hydration mismatch
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
