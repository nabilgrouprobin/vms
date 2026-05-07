import { clearSession, getAccessToken } from "@/lib/auth-storage";

export function getApiBase(): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!apiBase) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is missing. Set it in Vercel environment variables for production."
    );
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
