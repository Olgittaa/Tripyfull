import type { NextConfig } from "next";

// The chat only ever runs inside the portal's iframe. frame-ancestors lets the
// portal embed it and stops every other site from framing it (clickjacking).
const portalOrigin = process.env.NEXT_PUBLIC_PORTAL_ORIGIN ?? "http://localhost:5173";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Content-Security-Policy", value: `frame-ancestors 'self' ${portalOrigin}` }],
      },
    ];
  },
};

export default nextConfig;
