/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "11mb"
    }
  },
  transpilePackages: ["@makyn/core", "@makyn/db"]
};

module.exports = nextConfig;
