import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const normalizedBackendOrigin = (
  process.env.BACKEND_INTERNAL_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  "http://127.0.0.1:4000"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  /** Monorepo: trace dependencies from repo root (pairs with root `package.json` + Prettier). */
  outputFileTracingRoot: path.join(__dirname, ".."),
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@tanstack/react-query",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-label",
      "@radix-ui/react-slot"
    ]
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${normalizedBackendOrigin}/:path*`
      }
    ];
  }
};

export default nextConfig;
