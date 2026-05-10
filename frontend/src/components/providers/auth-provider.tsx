"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { clearSession, getUserProfile, setUserProfile } from "@/lib/auth-storage";
import type { StoredUserProfile } from "@/lib/auth-storage";

type AuthContextValue = {
  /** Latest profile (may be `null` when signed out). */
  profile: StoredUserProfile | null;
  /** Replace the in-memory + persisted profile (e.g. after `/auth/login`). */
  setProfile: (next: StoredUserProfile | null) => void;
  /** Sign out: clears storage, React Query cache, and routes to `/login`. */
  signOut: () => void;
  /** True until the first read from `localStorage` finishes (avoids hydration flash). */
  hydrated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const PROFILE_STORAGE_KEY = "vms_user_profile";
const TOKEN_STORAGE_KEY = "vms_access_token";

/**
 * Reactive wrapper around `auth-storage`. Components should read user state
 * via `useAuth()` instead of calling `getUserProfile()` directly so they
 * re-render when the user signs in / out (in this tab or another tab via
 * the `storage` event), and so the React Query cache is reliably purged on
 * sign-out.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();

  const [profile, setProfileState] = useState<StoredUserProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfileState(getUserProfile());
    setHydrated(true);

    function onStorage(e: StorageEvent) {
      if (e.key === PROFILE_STORAGE_KEY || e.key === TOKEN_STORAGE_KEY || e.key === null) {
        setProfileState(getUserProfile());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Re-read on route change too — covers the case where login/signup pages
  // call `setUserProfile()` and immediately navigate without firing `storage`.
  useEffect(() => {
    setProfileState(getUserProfile());
  }, [pathname]);

  const setProfile = useCallback((next: StoredUserProfile | null) => {
    setUserProfile(next);
    setProfileState(next);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setProfileState(null);
    // Drop every cached query so the next signed-in user doesn't see stale lists.
    qc.clear();
    router.replace("/login");
    router.refresh();
  }, [qc, router]);

  const value = useMemo<AuthContextValue>(
    () => ({ profile, setProfile, signOut, hydrated }),
    [profile, setProfile, signOut, hydrated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() must be used inside <AuthProvider>");
  }
  return ctx;
}

/** Convenience: just the profile, mirrors the old `getUserProfile()` shape. */
export function useUserProfile(): StoredUserProfile | null {
  return useAuth().profile;
}
