import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dtgcctkekahzjtvepowr.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // pdfkit loads metrics at runtime; keep it external to the server bundle.
  serverExternalPackages: ["pdfkit"],
  // A stray lockfile in the parent directory confuses workspace-root detection;
  // pin it to this project.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
