import type { NextConfig } from "next";

const API_TARGET =
  process.env.RESEARCH_API_PROXY_TARGET ?? "https://scholargraph-n29d.onrender.com";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_TARGET}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;