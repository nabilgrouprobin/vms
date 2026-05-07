import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:4000/:path*"
        }
      ];
    }
    return [];
  }
};

export default nextConfig;
