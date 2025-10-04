// src/config/site.ts
export const siteConfig = {
  name: "Plumbers Portal",
  description:
    "Find trusted, local plumbers across the UK with the Plumbers Portal. Post your job for free and receive competitive quotes from qualified tradespeople in your area.",
  url: "https://plumbersportal.com",
  ogImage: "https://plumbersportal.com/og.jpg",
  links: {
    twitter: "https://twitter.com/plumbersportal",
    github: "https://github.com/raymondoh/plumbers-portal"
  },
  keywords: [
    "plumbing services",
    "emergency plumber",
    "professional plumbers",
    "pipe repairs",
    "drain cleaning",
    "water heater installation",
    "bathroom plumbing",
    "kitchen plumbing",
    "leak detection",
    "boiler services",
    "central heating",
    "plumbing maintenance",
    "local plumbers",
    "plumbing quote",
    "24/7 plumber",
    "blocked drains",
    "toilet repairs",
    "tap installation"
  ],
  authors: [
    {
      name: "Plumbers Portal Team",
      url: "https://plumbersportal.com"
    }
  ],
  creator: "Plumbers Portal",
  metadataBase: new URL("https://plumbersportal.com")
};

export type SiteConfig = typeof siteConfig;
