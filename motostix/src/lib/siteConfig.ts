export type NavItem = {
  /** Display text for the navigation link. */
  label: string;
  /** Destination URL or pathname. */
  href: string;
  /** Whether the link should open externally. */
  external?: boolean;
};

export const siteConfig = {
  /** Brand name used across metadata and UI. */
  name: "MotoStix",
  /** Default description for search engines and previews. */
  description: "High-quality vehicle stickers and accessories.",
  /** Primary site URL, configurable via environment variable. */
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  /** Default Open Graph image URL. */
  ogImage: process.env.OG_IMAGE_URL ?? "/og.jpg",
  /** Twitter handle for card previews. */
  twitter: process.env.SITE_TWITTER ?? "@motostix",
  /** Commonly used external and internal links. */
  links: {
    /** GitHub repository link. */
    github: "https://github.com/raymondoh/motostix",
    /** Twitter profile link. */
    twitter: "https://twitter.com/motostix",
    /** Contact page link. */
    contact: "/contact"
  },
  /** Primary navigation items displayed in the header. */
  nav: [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" }
  ] satisfies NavItem[]
} as const;

export type SiteConfig = typeof siteConfig;
