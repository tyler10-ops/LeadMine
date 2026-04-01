import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling these packages — they need native Node.js
  // TCP sockets and will fail if tree-shaken or polyfilled by webpack.
  serverExternalPackages: ["ioredis", "bullmq"],
};

export default nextConfig;
