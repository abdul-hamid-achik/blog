import "./env.mjs"

import { withContentCollections } from "@content-collections/next"
import withNextIntlPlugin from "next-intl/plugin"

const withNextIntl = withNextIntlPlugin("./i18n.ts")

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.gr-assets.com",
      },
      {
        protocol: "https",
        hostname: "www.abdulachik.dev",
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
  async headers() {
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
    ]

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/api/graphql",
        headers: [
          ...(process.env.NODE_ENV !== "production"
            ? [
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
              ]
            : []),
        ],
      },
    ]
  },
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    config.plugins.push(new webpack.ContextReplacementPlugin(/keyv/))
    return config
  },
}

export default withNextIntl(withContentCollections(nextConfig))
