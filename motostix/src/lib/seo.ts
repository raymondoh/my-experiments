import type { Metadata } from "next";

import { siteConfig } from "./siteConfig";

export function baseMetadata(): Metadata {
  const url = new URL(siteConfig.url);

  return {
    metadataBase: url,
    title: {
      default: siteConfig.name,
      template: `%s · ${siteConfig.name}`
    },
    description: siteConfig.description,
    openGraph: {
      type: "website",
      url: siteConfig.url,
      siteName: siteConfig.name,
      title: siteConfig.name,
      description: siteConfig.description,
      images: [{ url: siteConfig.ogImage }]
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitter,
      title: siteConfig.name,
      description: siteConfig.description,
      images: [siteConfig.ogImage]
    },
    alternates: {
      canonical: siteConfig.url
    },
    icons: { icon: "/favicon.ico", shortcut: "/favicon.ico" }
  };
}

/** Convenience for pages that want to override title/description/og */
export function pageMetadata(opts: {
  title?: string;
  description?: string;
  path?: string; // e.g. "/products/helmets"
  image?: string;
}): Metadata {
  const base = baseMetadata();
  const url = opts.path ? new URL(opts.path, siteConfig.url).toString() : siteConfig.url;
  const title = opts.title ?? base.title;
  const description = opts.description ?? siteConfig.description;
  const image = opts.image ?? siteConfig.ogImage;

  return {
    ...base,
    title,
    description,
    openGraph: { ...base.openGraph, url, title, description, images: [{ url: image }] },
    twitter: { ...base.twitter, title, description, images: [image] },
    alternates: { canonical: url }
  };
}
