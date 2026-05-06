import { randomBytes } from "node:crypto";

/**
 * Allocates a short unique human-readable code (prefix + random hex).
 */
export async function allocateUniqueCode(
  exists: (code: string) => Promise<boolean>,
  prefix: string
): Promise<string> {
  for (let i = 0; i < 32; i++) {
    const code = `${prefix}-${randomBytes(4).toString("hex").toUpperCase()}`;
    if (!(await exists(code))) return code;
  }
  throw new Error(`Could not allocate a unique code for prefix ${prefix}`);
}
