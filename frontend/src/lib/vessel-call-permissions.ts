import type { StoredUserProfile } from "@/lib/auth-storage";

/** Mirrors backend `SOF_EDITOR_ROLES` for creating/updating vessel calls. */
const VESSEL_CALL_EDITOR_ROLES = new Set<string>([
  "SUPER_ADMIN",
  "SYSTEM_ADMIN",
  "OPERATIONS_MANAGER",
  "MOTHER_VESSEL_ADMIN"
]);

export function canCreateVesselCalls(profile: StoredUserProfile | null): boolean {
  if (!profile?.roles?.length) return false;
  return profile.roles.some((r) => VESSEL_CALL_EDITOR_ROLES.has(r));
}
