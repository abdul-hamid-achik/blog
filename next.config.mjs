import "./env.mjs";

import { withContentCollections } from "@content-collections/next";
import withNextIntlPlugin from "next-intl/plugin";

const withNextIntl = withNextIntlPlugin("./i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.gr-assets.com",
      },
      {
        protocol: "https",
        hostname: "abdulachik.dev",
      },
      {
        protocol: "https",
        hostname: "**.abdulachik.dev",
      },
      ...(process.env.NODE_ENV !== "production"
        ? [
            {
              protocol: "http",
              hostname: "localhost",
            },
          ]
        : []),
    ],
  },
  headers() {
    const securityHeaders = [
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-XSS-Protection",
        value: "1; mode=block",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: "Content-Security-Policy",
        value:
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://vercel.live https://va.vercel-scripts.com https://vitals.vercel-insights.com; frame-src https://embed.music.apple.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
      },
    ];

    return Promise.resolve([
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      ...(process.env.NODE_ENV !== "production"
        ? [
            {
              source: "/api/graphql",
              headers: [
                { key: "Access-Control-Allow-Credentials", value: "true" },
                {
                  key: "Access-Control-Allow-Origin",
                  value: "https://studio.apollographql.com",
                },
                {
                  key: "Access-Control-Allow-Methods",
                  value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
                },
                {
                  key: "Access-Control-Allow-Headers",
                  value:
                    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
                },
              ],
            },
          ]
        : []),
    ]);
  },
};

export default withContentCollections(withNextIntl(nextConfig));
