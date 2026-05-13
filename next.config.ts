import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray lockfile in the parent directory confuses workspace-root detection;
  // pin it to this project.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
