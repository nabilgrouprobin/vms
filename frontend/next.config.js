const path = require('path');

const nextConfig = {
  /** Monorepo: trace dependencies from repo root (pairs with root `package.json` + Prettier). */
  outputFileTracingRoot: path.join(__dirname, '..'),
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-label',
      '@radix-ui/react-slot'
    ]
  }
};

module.exports = nextConfig;
