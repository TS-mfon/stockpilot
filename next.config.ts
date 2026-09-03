import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  transpilePackages: ["@stockpilot/domain", "@stockpilot/engine", "@stockpilot/execution-adapters"],
  typescript: { ignoreBuildErrors: true },
};
export default nextConfig;
