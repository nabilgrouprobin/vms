import type { ZodType } from "zod";

import { clearSession, getAccessToken } from "@/lib/auth-storage";

export function getApiBase(): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!apiBase) {
    return "/api";
  }
  return apiBase.replace(/\/+$/, "");
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Raised when a 2xx response body fails to match the zod schema passed to
 * `apiValidated(...)`. Catch separately from `ApiError` (network/4xx/5xx) at
 * call sites that want to surface "backend drift" differently from a normal
 * server error.
 */
export class ApiSchemaError extends Error {
  constructor(
    message: string,
    public path: string,
    public issues: unknown
  ) {
    super(message);
    this.name = "ApiSchemaError";
  }
}

export async function api<T>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } }
): Promise<T> {
  const base = getApiBase();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const token = getAccessToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers
    }
  });

  const text = await res.text();
  if (!res.ok) {
    if (res.status === 401 && token) {
      clearSession();
    }
    throw new ApiError(res.statusText || "Request failed", res.status, text);
  }

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/**
 * Like `api()` but parses the success body through a zod schema before
 * returning. Use for endpoints whose shape we depend on heavily (auth, SOF
 * chip peeks, paginated lists) — drift in the backend response shape throws
 * `ApiSchemaError` instead of silently returning a half-typed object.
 *
 * The schema is applied **only** on `2xx` with a non-empty body. Empty bodies
 * still resolve to `undefined` and error responses still throw `ApiError`.
 */
export async function apiValidated<S extends ZodType>(
  path: string,
  schema: S,
  init?: RequestInit & { next?: { revalidate?: number } }
): Promise<ReturnType<S["parse"]>> {
  const raw = await api<unknown>(path, init);
  const result = schema.safeParse(raw);
  if (!result.success) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[apiValidated] schema mismatch on ${path}`, result.error.issues, raw);
    }
    throw new ApiSchemaError(
      `Server response for ${path} did not match the expected shape.`,
      path,
      result.error.issues
    );
  }
  return result.data as ReturnType<S["parse"]>;
}
