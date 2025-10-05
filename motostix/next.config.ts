// next.config.ts
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["*"]
    }
  },
  webpack: config => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
      fs: false,
      http2: false,
      http: false,
      https: false,
      zlib: false,
      child_process: false
    };

    if (!isDev) {
      config.module.rules.push({
        test: /\.(js|ts|tsx)$/,
        include: /src\/dev/,
        use: {
          loader: "null-loader"
        }
      });
    }

    return config;
  },
  serverExternalPackages: ["firebase-admin"],
  // Stripe/Firebase Admin SDKs rely on Node APIs, so keep the default runtime.
  // runtime: "nodejs",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "**.stripe.com",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "**.images.unsplash.com",
        pathname: "/**"
      }
    ],
    formats: ["image/avif", "image/webp"]
  },
  async headers() {
    const securityHeaders = [
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
    ];

    if (!isDev) {
      securityHeaders.push({
        key: "Content-Security-Policy",
        value: `
          default-src 'self';
          script-src 'self' 'unsafe-inline' https://apis.google.com https://*.gstatic.com https://*.firebaseio.com;
          style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
          img-src 'self' data: https://*.googleusercontent.com https://*.google.com;
          font-src 'self' https://fonts.gstatic.com;
          connect-src 'self' https://*.googleapis.com https://firestore.googleapis.com https://*.firebaseio.com;
          frame-src 'self' https://*.firebaseapp.com https://accounts.google.com;
          object-src 'none';
          base-uri 'self';
          form-action 'self';
          upgrade-insecure-requests;
        `
          .replace(/\s{2,}/g, " ")
          .trim()
      });
    }

    return [{ source: "/(.*)", headers: securityHeaders }];
  }
};

export default nextConfig;
