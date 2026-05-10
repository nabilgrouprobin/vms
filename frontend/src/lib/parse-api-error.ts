import { ApiError } from "@/lib/api";

export function parseApiErr(e: unknown): string {
  if (e instanceof ApiError && e.body) {
    try {
      const j = JSON.parse(e.body) as {
        message?: string | string[];
        error?: string;
      };
      const m = j.message;
      const fromMessage = Array.isArray(m) ? m.join(", ") : m;
      if (fromMessage && String(fromMessage).trim()) {
        return String(fromMessage);
      }
      if (j.error && typeof j.error === "string" && j.error.trim()) {
        return j.error;
      }
    } catch {
      const raw = e.body.trim();
      if (raw.length > 0 && raw.length < 800) {
        return raw;
      }
    }
    return `${e.message} (${e.status})`;
  }
  if (e instanceof ApiError) {
    return `${e.message} (${e.status})`;
  }
  return e instanceof Error ? e.message : "Error";
}
