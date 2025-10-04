// next.config.ts
import type { NextConfig } from "next";

const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET; // e.g. "your-app.appspot.com"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Firebase Storage download URLs:
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        // Be specific to your bucket if provided; otherwise allow any bucket
        pathname: BUCKET ? `/v0/b/${BUCKET}/o/**` : "/v0/b/**/o/**"
      },
      // New Firebase Storage domain
      {
        protocol: "https",
        hostname: "*.firebasestorage.app",
        pathname: "/**"
      },
      // Optional: Googleusercontent (common for user/profile photos)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**"
      },
      // Optional: Public/storage.googleapis.com bucket URLs
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: BUCKET ? `/${BUCKET}/**` : "/**"
      }
    ],
    formats: ["image/avif", "image/webp"]
  },

  // Your other options
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },

  // This is still needed to handle firebase-admin on the server
  serverExternalPackages: ["firebase-admin"],

  webpack: (config, { isServer }) => {
    // This correctly prevents firebase-admin from being bundled on the client
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "firebase-admin": false
      };
    }
    return config;
  }
};

export default nextConfig;
