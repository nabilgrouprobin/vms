import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// `__dirname` shim for ESM. `import.meta.dirname` works on Node 20.11+, this
// fileURLToPath form is the explicit fallback if you ever drop to older Node.
const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"]
  },
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src")
    }
  }
});
