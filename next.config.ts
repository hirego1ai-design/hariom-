import type { NextConfig } from "next";
import { configuredSecurityHeaders } from "./src/lib/securityHeaders";

const nextConfig: NextConfig = {
  distDir: process.env.HIREGO_AUDIT_BUILD === "1" ? ".next-audit" : ".next",
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    const headers = Object.entries(
      configuredSecurityHeaders(process.env.NODE_ENV !== "production"),
    ).map(([key, value]) => ({ key, value }));

    return [
      {
        source: "/:path*",
        headers,
      },
    ];
  },
};

export default nextConfig;
