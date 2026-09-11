import type { NextConfig } from "next";
import { contentSecurityPolicy } from "./src/lib/securityHeaders";

const nextConfig: NextConfig = {
  distDir: process.env.HIREGO_AUDIT_BUILD === "1" ? ".next-audit" : ".next",
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy(process.env.NODE_ENV !== "production") },
        ],
      },
    ];
  },
};

export default nextConfig;
