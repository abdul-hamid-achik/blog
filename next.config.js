const { withContentlayer } = require("next-contentlayer")
const withNextIntl = require("next-intl/plugin")("./i18n.ts")

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.gr-assets.com",
      },
    ],
  },
}

module.exports = withNextIntl(withContentlayer(nextConfig))
