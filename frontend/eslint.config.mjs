import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      ".next-prod/**",
      ".next-old/**",
      "node_modules/**",
      "next-env.d.ts",
      /** CommonJS launcher — requires `require()`. */
      "scripts/**/*.cjs"
    ]
  },
  {
    rules: {
      /**
       * The codebase intentionally resets sheet/form local state from query props in effects.
       * Migrating every surface to keyed remounts or external stores is tracked separately.
       */
      "react-hooks/set-state-in-effect": "off"
    }
  }
];

export default eslintConfig;
