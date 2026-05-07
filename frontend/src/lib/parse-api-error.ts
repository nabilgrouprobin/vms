import { ApiError } from "@/lib/api";

export function parseApiErr(e: unknown): string {
  if (e instanceof ApiError && e.body) {
    try {
      const j = JSON.parse(e.body) as { message?: string | string[] };
      const m = j.message;
      return Array.isArray(m) ? m.join(", ") : (m ?? e.message);
    } catch {
      return e.message;
    }
  }
  return e instanceof Error ? e.message : "Error";
}
