const TOKEN_KEY = "vms_access_token";
const USER_KEY = "vms_user_profile";

export type StoredUserProfile = {
  id: string;
  email: string | null;
  phone: string;
  fullName: string;
  organizationId: string | null;
  roles: string[];
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getUserProfile(): StoredUserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUserProfile;
  } catch {
    return null;
  }
}

export function setUserProfile(user: StoredUserProfile | null): void {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export function clearSession(): void {
  setAccessToken(null);
  setUserProfile(null);
}
